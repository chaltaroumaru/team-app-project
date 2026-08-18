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

/**
 * BM25-ish scoring: builds a per-entry weighted "document" by repeating
 * title/tag tokens to boost their importance, then scores against the
 * query tokens using standard BM25 term-frequency saturation.
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
    const tokens = [
      ...repeat(tokenize(entry.title), FIELD_WEIGHTS.title),
      ...repeat(tokenize(entry.tags), FIELD_WEIGHTS.tags),
      ...repeat(tokenize(entry.content), FIELD_WEIGHTS.content),
    ];
    const freq = new Map<string, number>();
    for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);
    return { entry, tokens, freq };
  });

  const avgLen =
    docs.reduce((sum, d) => sum + d.tokens.length, 0) / (docs.length || 1);

  const df = new Map<string, number>();
  for (const token of queryTokens) {
    let count = 0;
    for (const d of docs) if (d.freq.has(token)) count++;
    df.set(token, count);
  }

  const N = docs.length;
  const results: ScoredEntry[] = docs.map((d) => {
    let score = 0;
    for (const token of queryTokens) {
      const f = d.freq.get(token) ?? 0;
      if (f === 0) continue;
      const n = df.get(token) ?? 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      const denom = f + k1 * (1 - b + (b * d.tokens.length) / (avgLen || 1));
      score += idf * ((f * (k1 + 1)) / (denom || 1));
    }
    return { entry: d.entry, score };
  });

  return results
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

function repeat<T>(arr: T[], times: number): T[] {
  const out: T[] = [];
  for (let i = 0; i < times; i++) out.push(...arr);
  return out;
}

export async function retrieveRelevantKnowledge(
  query: string,
  limit = 6
): Promise<KnowledgeEntry[]> {
  const entries = await prisma.knowledgeEntry.findMany();
  const scored = scoreEntries(entries, query);
  return scored.slice(0, limit).map((s) => s.entry);
}
