"use client";

import { useRef, useState } from "react";

interface UsedKnowledge {
  id: string;
  title: string;
  category: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  usedKnowledge?: UsedKnowledge[];
}

export default function CoachPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "assistant",
      content:
        "こんにちは!VALORANTコーチAIです。エージェント運用、マップの立ち回り、撃ち合い、経済判断など、なんでも聞いてください。",
    },
  ]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "エラーが発生しました");
      setConversationId(data.conversationId);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply,
          usedKnowledge: data.usedKnowledge,
        },
      ]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-160px)]">
      <div>
        <h1 className="text-2xl font-bold">コーチに質問する</h1>
        <p className="text-neutral-400 text-sm mt-1">
          ナレッジベースの知識をもとに回答します。同じUIとAPI(<code>/api/coach/chat</code>)は外部のコーチングサイトにも組み込めます。
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
              {m.usedKnowledge && m.usedKnowledge.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {m.usedKnowledge.map((k) => (
                    <span
                      key={k.id}
                      className="text-xs rounded bg-neutral-800 px-2 py-0.5 text-neutral-400"
                      title={k.title}
                    >
                      参照: {k.title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && <p className="text-neutral-500 text-sm">コーチが考え中...</p>}
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
          placeholder="例: アセントのAサイトでレトプレイしたい時のコツは?"
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
