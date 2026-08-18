import { prisma } from "@/lib/db";
import type { KnowledgeEntry } from "@/generated/prisma/client";

/**
 * Lightweight retrieval layer for the knowledge base.
 *
 * No external vector DB / embeddings API is required: knowledge entries are
 * scored with BM25 over a tokenizer that mixes Latin-word tokens (agent /
 * map / weapon names are usually English) with character bigrams for
 * Japanese text (which has no whitespace word boundaries). This keeps the
 * MVP dependency-free; swapping in a real vector store later only means
 * replacing `scoreEntries` with an embedding similarity lookup.
 */

const LATIN_TOKEN_RE = /[a-zA-Z0-9]+/g;
const CJK_RE = /[぀-ヿ㐀-鿿豈-﫿]+/g;

export function tokenize(text: string): string[] {
  const tokens: string[] = [];
  const normalized = text.toLowerCase();

  for (const match of normalized.matchAll(LATIN_TOKEN_RE)) {
    tokens.push(match[0]);
  }

  for (const run of normalized.match(CJK_RE) ?? []) {
    if (run.length === 1) {
      tokens.push(run);
      continue;
    }
    for (let i = 0; i < run.length - 1; i++) {
      tokens.push(run.slice(i, i + 2));
    }
  }

  return tokens;
}

interface ScoredEntry {
  entry: KnowledgeEntry;
  score: number;
}

const FIELD_WEIGHTS = { title: 3, tags: 2, content: 1 } as const;
type Field = keyof typeof FIELD_WEIGHTS;
const FIELDS = Object.keys(FIELD_WEIGHTS) as Field[];

/**
 * Multi-field BM25: each field (title/tags/content) is tokenized and
 * scored independently against its own average field length, then summed
 * with a per-field weight. Scoring each field separately (rather than
 * concatenating a weighted, duplicated token list into one "document")
 * keeps title/tag importance from also distorting the length-normalization
 * term that BM25 applies to the content field.
 */
export function scoreEntries(
  entries: KnowledgeEntry[],
  query: string,
  k1 = 1.5,
  b = 0.75
): ScoredEntry[] {
  const queryTokens = Array.from(new Set(tokenize(query)));
  if (queryTokens.length === 0) return [];

  const docs = entries.map((entry) => {
    const fieldTokens = {
      title: tokenize(entry.title),
      tags: tokenize(entry.tags),
      content: tokenize(entry.content),
    } satisfies Record<Field, string[]>;

    const fieldFreq = {} as Record<Field, Map<string, number>>;
    const presence = new Set<string>();
    for (const field of FIELDS) {
      const freq = new Map<string, number>();
      for (const t of fieldTokens[field]) {
        freq.set(t, (freq.get(t) ?? 0) + 1);
        presence.add(t);
      }
      fieldFreq[field] = freq;
    }

    return { entry, fieldTokens, fieldFreq, presence };
  });

  const avgLen = {} as Record<Field, number>;
  for (const field of FIELDS) {
    avgLen[field] = docs.reduce((sum, d) => sum + d.fieldTokens[field].length, 0) / (docs.length || 1);
  }

  const N = docs.length;
  const df = new Map<string, number>();
  for (const token of queryTokens) {
    df.set(token, docs.filter((d) => d.presence.has(token)).length);
  }

  const results: ScoredEntry[] = docs.map((d) => {
    let score = 0;
    for (const token of queryTokens) {
      const n = df.get(token) ?? 0;
      if (n === 0) continue;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      for (const field of FIELDS) {
        const f = d.fieldFreq[field].get(token) ?? 0;
        if (f === 0) continue;
        const len = d.fieldTokens[field].length;
        const denom = f + k1 * (1 - b + (b * len) / (avgLen[field] || 1));
        score += FIELD_WEIGHTS[field] * idf * ((f * (k1 + 1)) / (denom || 1));
      }
    }
    return { entry: d.entry, score };
  });

  return results
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

export async function retrieveRelevantKnowledge(
  query: string,
  limit = 6
): Promise<KnowledgeEntry[]> {
  const entries = await prisma.knowledgeEntry.findMany();
  const scored = scoreEntries(entries, query);
  return scored.slice(0, limit).map((s) => s.entry);
}
