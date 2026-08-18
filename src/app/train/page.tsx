"use client";

import { useRef, useState } from "react";
import { CATEGORY_LABELS } from "@/lib/prompts";
import type { KnowledgeDraft } from "@/lib/knowledgeDrafts";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  drafts?: KnowledgeDraft[];
  savedIndexes?: number[];
}

export default function TrainPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "assistant",
      content:
        "こんにちは、コーチ。あなたの持つVALORANTの知識をAIに教えてください。エージェント運用でも、マップの立ち回りでも、撃ち合いの考え方でも構いません。まずは得意な分野から聞かせてください。",
    },
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/train/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "エラーが発生しました");
      setSessionId(data.sessionId);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply,
          drafts: data.drafts,
          savedIndexes: [],
        },
      ]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function saveDraft(msgId: string, index: number, draft: KnowledgeDraft) {
    const res = await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, source: "CHAT" }),
    });
    if (res.ok) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, savedIndexes: [...(m.savedIndexes ?? []), index] } : m
        )
      );
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-160px)]">
      <div>
        <h1 className="text-2xl font-bold">知識を教える</h1>
        <p className="text-neutral-400 text-sm mt-1">
          AIが深掘り質問をしながら、あなたの知識をナレッジベースの知識エントリとして提案します。提案は確認してから保存されます。
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 py-4">
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-red-500 text-white"
                  : "bg-neutral-900 border border-neutral-800 text-neutral-100"
              }`}
            >
              {m.content}
              {m.drafts && m.drafts.length > 0 && (
                <div className="mt-3 space-y-2">
                  {m.drafts.map((d, i) => {
                    const saved = m.savedIndexes?.includes(i);
                    return (
                      <div
                        key={i}
                        className="rounded-md border border-red-800/50 bg-neutral-950 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs rounded bg-neutral-800 px-2 py-0.5 text-neutral-300">
                            {CATEGORY_LABELS[d.category]}
                          </span>
                          {saved ? (
                            <span className="text-xs text-green-400">保存済み</span>
                          ) : (
                            <button
                              onClick={() => saveDraft(m.id, i, d)}
                              className="text-xs rounded bg-red-500 hover:bg-red-400 text-white px-2 py-1"
                            >
                              ナレッジベースに保存
                            </button>
                          )}
                        </div>
                        <div className="font-medium mt-1">{d.title}</div>
                        <div className="text-neutral-400 mt-0.5">{d.content}</div>
                        {d.tags && (
                          <div className="text-xs text-neutral-500 mt-1">tags: {d.tags}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && <p className="text-neutral-500 text-sm">AIが考え中...</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex gap-2 border-t border-neutral-800 pt-3"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="例: アセントのAサイトはヴァイパーの壁が重要で..."
          rows={2}
          className="flex-1 rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm resize-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-400 disabled:opacity-50 transition-colors"
        >
          送信
        </button>
      </form>
    </div>
  );
}
