import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AnthropicConfigError, COACH_MODEL, extractResponseText, getAnthropicClient } from "@/lib/anthropic";
import { appendMessage, getOrCreateConversation, loadHistory } from "@/lib/chat";
import { buildTrainingSystemPrompt, CATEGORY_LABELS } from "@/lib/prompts";
import { extractKnowledgeDrafts } from "@/lib/knowledgeDrafts";

async function buildExistingSummary(): Promise<string> {
  const entries = await prisma.knowledgeEntry.findMany({
    select: { category: true, title: true },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  if (entries.length === 0) return "";
  return entries
    .map((e) => `- [${CATEGORY_LABELS[e.category as keyof typeof CATEGORY_LABELS]}] ${e.title}`)
    .join("\n");
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { message, sessionId } = body ?? {};

  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "message は必須です" }, { status: 400 });
  }

  let client;
  try {
    client = getAnthropicClient();
  } catch (err) {
    if (err instanceof AnthropicConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    throw err;
  }

  const conversation = await getOrCreateConversation("TRAIN", sessionId);
  await appendMessage(conversation.id, "user", message.trim());

  const [history, existingSummary] = await Promise.all([
    loadHistory(conversation.id, 60),
    buildExistingSummary(),
  ]);

  const response = await client.messages.create({
    model: COACH_MODEL,
    max_tokens: 1500,
    system: buildTrainingSystemPrompt(existingSummary),
    messages: history.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })),
  });

  const { message: displayMessage, drafts } = extractKnowledgeDrafts(extractResponseText(response));

  await appendMessage(conversation.id, "assistant", displayMessage);

  return NextResponse.json({
    sessionId: conversation.id,
    reply: displayMessage,
    drafts,
  });
}
