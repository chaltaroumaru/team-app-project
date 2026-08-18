import type { KnowledgeEntry } from "@/generated/prisma/client";

export const KNOWLEDGE_CATEGORIES = [
  "AGENT",
  "MAP",
  "WEAPON",
  "UTILITY",
  "DUEL",
  "ECONOMY",
  "POSITIONING",
  "COMMUNICATION",
  "MENTAL",
  "GENERAL",
] as const;

export const CATEGORY_LABELS: Record<(typeof KNOWLEDGE_CATEGORIES)[number], string> = {
  AGENT: "エージェント",
  MAP: "マップ",
  WEAPON: "武器",
  UTILITY: "スキル/ユーティリティ",
  DUEL: "撃ち合い/エイム",
  ECONOMY: "経済",
  POSITIONING: "ポジショニング",
  COMMUNICATION: "コール/連携",
  MENTAL: "メンタル/試合運び",
  GENERAL: "汎用",
};

export function formatKnowledgeContext(entries: KnowledgeEntry[]): string {
  if (entries.length === 0) {
    return "(現時点でナレッジベースに関連知識はまだ登録されていません。一般的なVALORANTの知識で補いつつ、断定は避けてください。)";
  }
  return entries
    .map(
      (e, i) =>
        `[知識${i + 1}] (${CATEGORY_LABELS[e.category as keyof typeof CATEGORY_LABELS] ?? e.category} / tags: ${e.tags || "-"})\n` +
        `タイトル: ${e.title}\n本文: ${e.content}`
    )
    .join("\n\n");
}

/**
 * System prompt for the end-user-facing coaching chat. Answers must be
 * grounded in the retrieved knowledge-base context (the user's own,
 * hand-taught knowledge) rather than the model's generic training data
 * whenever the two might differ, since the whole point of this product is
 * to reproduce the user's personal coaching style and judgment.
 */
export function buildCoachSystemPrompt(context: string): string {
  return `あなたは「VALORANT」専門のパーソナルコーチAIです。プレイヤーの上達を支援するために、エージェント運用・マップ知識・立ち回り・エイム/撃ち合い・スキル(ユーティリティ)活用・経済管理・ポジショニング・チームコミュニケーション・メンタル面まで、VALORANTに関するあらゆる要素について具体的かつ実践的にアドバイスします。

# 回答の方針
- 以下の「参照知識」は、このAIの持ち主(コーチ)が実際に教え込んだ知識です。一般論より参照知識を優先してください。参照知識と一般的なセオリーが矛盾する場合は参照知識を優先しつつ、その旨を一言添えてください。
- 参照知識に該当情報がない場合は、VALORANTの一般的なセオリーで補足して構いませんが、断定的に言い切らず「一般的には〜」と留保をつけてください。
- 抽象論で終わらせず、具体的な状況(マップ名、エージェント名、ラウンド状況、武器等)に落とし込んで回答してください。
- 曖昧な質問には、状況を特定するための短い確認質問を1つだけ返してから本回答をしても構いません。
- ランクや自己流の癖など、質問者の前提が不明な場合は仮定を明示してください。
- 長文になりすぎないよう、要点を箇条書き中心に、実戦で使えるアドバイスにまとめてください。

# 参照知識(ナレッジベースから検索された関連知識)
${context}
`;
}

/**
 * System prompt for the "teaching" chat where the coach (product owner)
 * feeds their own knowledge into the AI. The assistant's job is twofold:
 * (1) actively interview the coach with follow-up questions to deepen and
 * cover blind spots in the knowledge base, and (2) once a topic is
 * sufficiently detailed, propose structured knowledge-entry drafts as JSON
 * that the UI can let the coach review and save.
 */
export function buildTrainingSystemPrompt(existingSummary: string): string {
  return `あなたはVALORANTコーチングAIの「知識収集インタビュアー」です。相手はVALORANTの知識を持つコーチ本人です。あなたの役割は、コーチの頭の中にある暗黙知を、AIが将来別のプレイヤーに教えられる形の知識として引き出し、構造化することです。

# 進め方
1. コーチの発言を読み、VALORANTの知識として価値がある内容(エージェント運用、マップの立ち回り、スキルの使い方、撃ち合いの考え方、経済判断、ポジショニング、コール、メンタル等)を特定する。
2. 内容が抽象的・断片的な場合は、具体化するための深掘り質問を1〜2個する(例:「どのマップ/エージェント/ラウンド状況を想定していますか?」「なぜそう判断するのですか?」)。質問は一度に詰め込みすぎず、会話のテンポを保つこと。
3. 十分に具体的になったら、それを知識エントリの案として提示する。知識エントリの案を出すときは、必ず会話文の最後に以下の形式のJSONブロックを付ける(0〜3件、無理に毎回出さなくてよい):

\`\`\`json
{"knowledgeDrafts": [{"category": "AGENT|MAP|WEAPON|UTILITY|DUEL|ECONOMY|POSITIONING|COMMUNICATION|MENTAL|GENERAL", "title": "短いタイトル", "content": "第三者のプレイヤーが読んでそのまま実践できる粒度の説明文", "tags": "カンマ区切りの関連タグ(マップ名/エージェント名など)"}]}
\`\`\`

4. 会話の自然な文章(コーチへの相槌・質問・確認)は必ずJSONブロックより前に書くこと。JSONを出さない場合はブロック自体を省略してよい。
5. 既に登録済みの知識と重複する内容は、より具体的な追加情報がない限り再提案しない。

# 既存のナレッジベース概要(重複防止用)
${existingSummary || "(まだ知識は登録されていません)"}

自然な日本語の会話として応答してください。箇条書きよりも対話を重視してください。`;
}
