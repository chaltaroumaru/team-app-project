"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CATEGORY_LABELS, KNOWLEDGE_CATEGORIES } from "@/lib/prompts";
import type { KnowledgeCategory, KnowledgeEntryDTO } from "./types";

const EMPTY_FORM = {
  category: "GENERAL" as KnowledgeCategory,
  title: "",
  content: "",
  tags: "",
};

export default function KnowledgeManager() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCategory = (searchParams.get("category") as KnowledgeCategory | null) ?? "";

  const [entries, setEntries] = useState<KnowledgeEntryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<KnowledgeCategory | "">(initialCategory);
  const [q, setQ] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/knowledge?${params.toString()}`);
      const data = await res.json();
      if (!cancelled) {
        setEntries(data);
        setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [category, q, reloadKey]);

  function refresh() {
    setReloadKey((k) => k + 1);
  }

  function onCategoryChange(next: KnowledgeCategory | "") {
    setCategory(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set("category", next);
    else params.delete("category");
    router.replace(`/knowledge?${params.toString()}`);
  }

  function startEdit(entry: KnowledgeEntryDTO) {
    setEditingId(entry.id);
    setForm({
      category: entry.category,
      title: entry.title,
      content: entry.content,
      tags: entry.tags,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.title.trim() || !form.content.trim()) {
      setError("タイトルと本文は必須です");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        editingId ? `/api/knowledge/${editingId}` : "/api/knowledge",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "保存に失敗しました");
      }
      cancelEdit();
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("この知識エントリを削除しますか?")) return;
    await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
    if (editingId === id) cancelEdit();
    refresh();
  }

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 space-y-3">
        <h2 className="font-semibold">
          {editingId ? "知識エントリを編集" : "知識エントリを手動追加"}
        </h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3">
            <select
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value as KnowledgeCategory }))
              }
              className="rounded-md bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm"
            >
              {KNOWLEDGE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="タイトル (例: アセントAサイト エントリー時のヴァイパー運用)"
              className="rounded-md bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm"
            />
          </div>
          <textarea
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            placeholder="内容: 第三者が読んでそのまま実践できる具体的な説明"
            rows={4}
            className="w-full rounded-md bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm"
          />
          <input
            value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            placeholder="タグ (カンマ区切り, 例: ascent,viper,entry)"
            className="w-full rounded-md bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-400 disabled:opacity-50 transition-colors"
            >
              {editingId ? "更新する" : "追加する"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-md border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-800 transition-colors"
              >
                キャンセル
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value as KnowledgeCategory | "")}
            className="rounded-md bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm"
          >
            <option value="">すべてのカテゴリ</option>
            {KNOWLEDGE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="キーワード検索"
            className="rounded-md bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm flex-1 min-w-[160px]"
          />
          <span className="text-xs text-neutral-500">{entries.length} 件</span>
        </div>

        {loading ? (
          <p className="text-neutral-500 text-sm">読み込み中...</p>
        ) : entries.length === 0 ? (
          <p className="text-neutral-500 text-sm">該当する知識がありません。</p>
        ) : (
          <ul className="space-y-2">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="rounded-lg border border-neutral-800 bg-neutral-900 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs rounded bg-neutral-800 px-2 py-0.5 text-neutral-300">
                        {CATEGORY_LABELS[entry.category]}
                      </span>
                      {entry.source === "CHAT" && (
                        <span className="text-xs rounded bg-red-500/20 text-red-300 px-2 py-0.5">
                          チャット由来
                        </span>
                      )}
                      <h3 className="font-medium">{entry.title}</h3>
                    </div>
                    <p className="text-sm text-neutral-400 mt-1 whitespace-pre-wrap">
                      {entry.content}
                    </p>
                    {entry.tags && (
                      <p className="text-xs text-neutral-500 mt-1">tags: {entry.tags}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(entry)}
                      className="text-xs rounded border border-neutral-700 px-2 py-1 hover:bg-neutral-800"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => onDelete(entry.id)}
                      className="text-xs rounded border border-neutral-700 px-2 py-1 hover:bg-red-900/40 hover:border-red-800"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
