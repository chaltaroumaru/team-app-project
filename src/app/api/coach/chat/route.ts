import { NextRequest, NextResponse } from "next/server";
import { AnthropicConfigError, COACH_MODEL, extractResponseText, getAnthropicClient } from "@/lib/anthropic";
import { appendMessage, getOrCreateConversation, loadHistory } from "@/lib/chat";
import { buildCoachSystemPrompt, formatKnowledgeContext } from "@/lib/prompts";
import { retrieveRelevantKnowledge } from "@/lib/retrieval";
import { corsHeaders } from "@/lib/cors";

/**
 * Public-ish endpoint meant to be called from this app's /coach page and,
 * once deployed, directly from an external coaching website's frontend
 * (see README for the embedding contract). Kept framework-agnostic:
 * plain JSON in, JSON out, CORS-enabled.
 */
export async function POST(req: NextRequest) {
  const headers = corsHeaders(req.headers.get("origin"));
  const body = await req.json().catch(() => null);
  const { message, conversationId } = body ?? {};

  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "message は必須です" }, { status: 400, headers });
  }

  let client;
  try {
    client = getAnthropicClient();
  } catch (err) {
    if (err instanceof AnthropicConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503, headers });
    }
    throw err;
  }

  const conversation = await getOrCreateConversation("COACH", conversationId);
  await appendMessage(conversation.id, "user", message.trim());

  const [history, relevant] = await Promise.all([
    loadHistory(conversation.id, 40),
    retrieveRelevantKnowledge(message.trim()),
  ]);

  const response = await client.messages.create({
    model: COACH_MODEL,
    max_tokens: 1200,
    system: buildCoachSystemPrompt(formatKnowledgeContext(relevant)),
    messages: history.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })),
  });

  const reply = extractResponseText(response);

  await appendMessage(conversation.id, "assistant", reply);

  return NextResponse.json(
    {
      conversationId: conversation.id,
      reply,
      usedKnowledge: relevant.map((e) => ({ id: e.id, title: e.title, category: e.category })),
    },
    { headers }
  );
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}
