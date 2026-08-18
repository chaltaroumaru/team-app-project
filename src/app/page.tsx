import Link from "next/link";
import { prisma } from "@/lib/db";
import { CATEGORY_LABELS, KNOWLEDGE_CATEGORIES } from "@/lib/prompts";

export const dynamic = "force-dynamic";

export default async function Home() {
  const total = await prisma.knowledgeEntry.count();
  const counts = await prisma.knowledgeEntry.groupBy({
    by: ["category"],
    _count: { _all: true },
  });
  const countMap = Object.fromEntries(counts.map((c) => [c.category, c._count._all]));

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold">あなたの知識で育つ、VALORANT専属コーチAI</h1>
        <p className="text-neutral-400 leading-relaxed">
          エージェント運用・マップの立ち回り・撃ち合い・経済管理・メンタルまで、あなたの知識をナレッジベースに蓄積し、
          その知識にもとづいて回答するコーチングAIです。育てたAIはAPI経由でコーチングサイトに組み込めます。
        </p>
        <div className="flex gap-3 pt-2">
          <Link
            href="/train"
            className="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-400 transition-colors"
          >
            知識を教える
          </Link>
          <Link
            href="/coach"
            className="rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            コーチに質問してみる
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">ナレッジベースの状況</h2>
          <span className="text-sm text-neutral-400">合計 {total} 件</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {KNOWLEDGE_CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/knowledge?category=${cat}`}
              className="rounded-lg border border-neutral-800 bg-neutral-900 p-3 hover:border-neutral-600 transition-colors"
            >
              <div className="text-xs text-neutral-400">{CATEGORY_LABELS[cat]}</div>
              <div className="text-2xl font-bold mt-1">{countMap[cat] ?? 0}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">使い方</h2>
        <ol className="space-y-2 text-sm text-neutral-400 list-decimal list-inside">
          <li>
            <span className="text-neutral-200 font-medium">「知識を教える」</span>
            でAIと会話しながら、あなたの知識を深掘りしてもらいましょう。会話から知識案が自動生成され、承認するとナレッジベースに保存されます。
          </li>
          <li>
            <span className="text-neutral-200 font-medium">「ナレッジベース」</span>
            では登録済みの知識をカテゴリ別に確認・編集・手動追加できます。
          </li>
          <li>
            <span className="text-neutral-200 font-medium">「コーチに質問する」</span>
            で実際にAIコーチと対話し、ナレッジベースを根拠にした回答が返ってくることを確認できます。
          </li>
          <li>
            外部のコーチングサイトに組み込む場合は <code className="text-neutral-300">POST /api/coach/chat</code> を直接呼び出せます(詳細はREADME参照)。
          </li>
        </ol>
      </section>
    </div>
  );
}
