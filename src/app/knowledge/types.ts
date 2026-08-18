import type { KNOWLEDGE_CATEGORIES } from "@/lib/prompts";

export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number];

export interface KnowledgeEntryDTO {
  id: string;
  category: KnowledgeCategory;
  title: string;
  content: string;
  tags: string;
  source: "CHAT" | "FORM" | "SEED";
  createdAt: string;
  updatedAt: string;
}
