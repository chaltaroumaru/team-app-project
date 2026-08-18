export type KnowledgeCategory =
  | "AGENT"
  | "MAP"
  | "WEAPON"
  | "UTILITY"
  | "DUEL"
  | "ECONOMY"
  | "POSITIONING"
  | "COMMUNICATION"
  | "MENTAL"
  | "GENERAL";

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
