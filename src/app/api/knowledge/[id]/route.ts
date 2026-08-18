import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { KNOWLEDGE_CATEGORIES } from "@/lib/prompts";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const entry = await prisma.knowledgeEntry.findUnique({ where: { id } });
  if (!entry) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(entry);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { category, title, content, tags } = body ?? {};

  if (category !== undefined && !KNOWLEDGE_CATEGORIES.includes(category)) {
    return NextResponse.json(
      { error: `category は次のいずれかである必要があります: ${KNOWLEDGE_CATEGORIES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const entry = await prisma.knowledgeEntry.update({
      where: { id },
      data: {
        ...(category !== undefined ? { category } : {}),
        ...(title !== undefined ? { title: String(title).trim() } : {}),
        ...(content !== undefined ? { content: String(content).trim() } : {}),
        ...(tags !== undefined ? { tags: String(tags).trim() } : {}),
      },
    });
    return NextResponse.json(entry);
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    await prisma.knowledgeEntry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
