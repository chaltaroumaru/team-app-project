import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { KNOWLEDGE_CATEGORIES } from "@/lib/prompts";
import { scoreEntries } from "@/lib/retrieval";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q");

  const entries = await prisma.knowledgeEntry.findMany({
    where: category ? { category: category as never } : undefined,
    orderBy: { updatedAt: "desc" },
  });

  if (q && q.trim()) {
    const scored = scoreEntries(entries, q.trim());
    return NextResponse.json(scored.map((s) => s.entry));
  }

  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { category, title, content, tags, source } = body ?? {};

  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "title は必須です" }, { status: 400 });
  }
  if (typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "content は必須です" }, { status: 400 });
  }
  if (!KNOWLEDGE_CATEGORIES.includes(category)) {
    return NextResponse.json(
      { error: `category は次のいずれかである必要があります: ${KNOWLEDGE_CATEGORIES.join(", ")}` },
      { status: 400 }
    );
  }

  const entry = await prisma.knowledgeEntry.create({
    data: {
      category,
      title: title.trim(),
      content: content.trim(),
      tags: typeof tags === "string" ? tags.trim() : "",
      source: source === "CHAT" || source === "SEED" ? source : "FORM",
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
