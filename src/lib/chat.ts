import { prisma } from "@/lib/db";
import type { ConversationKind } from "@/generated/prisma/client";

/**
 * Shared session/history plumbing for the two chat surfaces (/train and
 * /coach). Both need "find-or-create a conversation, append a message,
 * load ordered history" — kept here once instead of duplicated per route.
 */
export async function getOrCreateConversation(kind: ConversationKind, id?: string | null) {
  if (id) {
    const existing = await prisma.conversation.findUnique({ where: { id } });
    if (existing) return existing;
  }
  return prisma.conversation.create({ data: { kind } });
}

export function appendMessage(conversationId: string, role: "user" | "assistant", content: string) {
  return prisma.message.create({ data: { conversationId, role, content } });
}

export function loadHistory(conversationId: string, limit: number) {
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}
