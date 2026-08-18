import { KNOWLEDGE_CATEGORIES } from "@/lib/prompts";

export interface KnowledgeDraft {
  category: (typeof KNOWLEDGE_CATEGORIES)[number];
  title: string;
  content: string;
  tags: string;
}

const JSON_BLOCK_RE = /```json\s*([\s\S]*?)```\s*$/;

/**
 * Splits a training-chat assistant reply into the human-readable message
 * and any trailing `{"knowledgeDrafts": [...]}` JSON block it proposed,
 * per the format defined in buildTrainingSystemPrompt.
 */
export function extractKnowledgeDrafts(raw: string): {
  message: string;
  drafts: KnowledgeDraft[];
} {
  const match = raw.match(JSON_BLOCK_RE);
  if (!match) return { message: raw.trim(), drafts: [] };

  const message = raw.slice(0, match.index).trim();
  try {
    const parsed = JSON.parse(match[1]);
    const drafts = Array.isArray(parsed?.knowledgeDrafts)
      ? parsed.knowledgeDrafts.filter(isValidDraft)
      : [];
    return { message, drafts };
  } catch {
    return { message, drafts: [] };
  }
}

function isValidDraft(d: unknown): d is KnowledgeDraft {
  if (!d || typeof d !== "object") return false;
  const draft = d as Record<string, unknown>;
  return (
    typeof draft.title === "string" &&
    draft.title.trim().length > 0 &&
    typeof draft.content === "string" &&
    draft.content.trim().length > 0 &&
    typeof draft.category === "string" &&
    (KNOWLEDGE_CATEGORIES as readonly string[]).includes(draft.category)
  );
}
