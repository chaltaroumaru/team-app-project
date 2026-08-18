import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AnthropicConfigError, COACH_MODEL, getAnthropicClient } from "@/lib/anthropic";
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

  let session = sessionId
    ? await prisma.trainingSession.findUnique({ where: { id: sessionId } })
    : null;
  if (!session) {
    session = await prisma.trainingSession.create({ data: {} });
  }

  await prisma.trainingMessage.create({
    data: { sessionId: session.id, role: "user", content: message.trim() },
  });

  const history = await prisma.trainingMessage.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "asc" },
    take: 60,
  });

  let client;
  try {
    client = getAnthropicClient();
  } catch (err) {
    if (err instanceof AnthropicConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    throw err;
  }

  const existingSummary = await buildExistingSummary();

  const response = await client.messages.create({
    model: COACH_MODEL,
    max_tokens: 1500,
    system: buildTrainingSystemPrompt(existingSummary),
    messages: history.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })),
  });

  const rawText = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  const { message: displayMessage, drafts } = extractKnowledgeDrafts(rawText);

  await prisma.trainingMessage.create({
    data: { sessionId: session.id, role: "assistant", content: displayMessage },
  });

  return NextResponse.json({
    sessionId: session.id,
    reply: displayMessage,
    drafts,
  });
}
