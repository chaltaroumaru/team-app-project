import { Suspense } from "react";
import KnowledgeManager from "./KnowledgeManager";

export default function KnowledgePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">ナレッジベース</h1>
        <p className="text-neutral-400 text-sm mt-1">
          コーチAIが回答の根拠にする知識を管理します。「知識を教える」チャットからも自動で追加されます。
        </p>
      </div>
      <Suspense fallback={<p className="text-neutral-500 text-sm">読み込み中...</p>}>
        <KnowledgeManager />
      </Suspense>
    </div>
  );
}
