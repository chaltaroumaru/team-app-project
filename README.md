# VALORANT Coach AI

自分自身のVALORANTの知識を「教え込んで」育てる、パーソナルコーチAIです。育てたナレッジベースをもとにAIが回答し、最終的にコーチングサイトへAPI経由で組み込めます。

## コンセプト

1. **知識を教える** (`/train`) — AIと会話しながら、あなたの知識(エージェント運用・マップの立ち回り・撃ち合い・経済・ポジショニング・コール・メンタル等)を伝えます。AIは内容を深掘りする質問を返しつつ、十分具体的になった内容を知識エントリ案として提示します。提示された案は確認のうえ保存できます。
2. **ナレッジベース管理** (`/knowledge`) — 保存された知識をカテゴリ別に一覧・検索・手動追加・編集・削除できます。
3. **コーチに質問する** (`/coach`) — 蓄積したナレッジベースを根拠にAIコーチと対話します。関連知識が見つからない場合は一般的なVALORANTのセオリーで補いつつ、その旨を明示します。
4. **外部サイトへの組み込み** — `/coach` と同じ `POST /api/coach/chat` をコーチングサイトのフロントエンドから直接呼び出せます(下記「外部サイトへの組み込み方」参照)。

## 技術スタック

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite (`@prisma/adapter-better-sqlite3` ドライバアダプタ、Prisma 7)
- Anthropic API (`@anthropic-ai/sdk`) によるチャット生成
- ベクトルDB不要の軽量検索(BM25 + 日本語Bigramトークナイザ)によるナレッジ検索(RAG)

外部の埋め込み型ベクトルDBやOpenAI Embeddings APIを使わず、アプリ内でBM25風のキーワードスコアリングを行うことで、`ANTHROPIC_API_KEY` 以外の追加APIキーなしで動作します。ナレッジベースが数千件規模になった場合は `src/lib/retrieval.ts` の `scoreEntries` を実ベクトル検索に差し替える想定です。

## セットアップ

```bash
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed     # 基礎知識を少量シード(任意)
npm run dev
```

http://localhost:3000 を開きます。

### 環境変数

`.env` に以下を設定してください。

```env
DATABASE_URL="file:./dev.db"

# 必須: チャット/コーチ機能を使うにはAnthropicのAPIキーが必要です
ANTHROPIC_API_KEY="sk-ant-..."

# 任意: 使用するモデル (未設定時は claude-sonnet-4-5)
ANTHROPIC_MODEL="claude-sonnet-4-5"

# 任意: /api/coach/chat をブラウザから直接叩く外部サイトのオリジンを制限する場合
# (カンマ区切りで複数指定可。未設定時は "*" で全許可 = 本番では必ず設定すること)
COACH_API_ALLOWED_ORIGIN="https://your-coaching-site.com"
```

`ANTHROPIC_API_KEY` が未設定の場合、ナレッジベースのCRUD(`/knowledge`)は問題なく動作しますが、`/train` と `/coach` のチャットAPIは `503` エラーを返します。

## ディレクトリ構成

```
src/
  app/
    page.tsx              # ホーム(ナレッジベースの状況サマリー)
    knowledge/             # ナレッジベース管理画面
    train/                 # 知識補強チャット(教育モード)
    coach/                 # コーチングチャット
    api/
      knowledge/            # 知識CRUD API
      train/chat/            # 教育モードのチャットAPI(知識案抽出付き)
      coach/chat/             # コーチングチャットAPI(RAG + CORS対応)
  lib/
    db.ts                 # Prismaクライアント(better-sqlite3アダプタ)
    retrieval.ts           # BM25風の軽量ナレッジ検索
    anthropic.ts            # Anthropicクライアント
    prompts.ts               # コーチ人格 / 知識抽出インタビュアーのシステムプロンプト
    knowledgeDrafts.ts        # チャット応答からの知識案JSON抽出
    cors.ts                    # /api/coach/chat のCORS制御
prisma/
  schema.prisma           # KnowledgeEntry / TrainingSession / CoachConversation 等
  seed.ts                  # 基礎知識の初期シード
```

## データモデル

- `KnowledgeEntry`: カテゴリ(AGENT/MAP/WEAPON/UTILITY/DUEL/ECONOMY/POSITIONING/COMMUNICATION/MENTAL/GENERAL)、タイトル、本文、タグ、由来(CHAT/FORM/SEED)を持つ知識の最小単位。
- `TrainingSession` / `TrainingMessage`: 「知識を教える」チャットの会話履歴。
- `CoachConversation` / `CoachMessage`: コーチングチャットの会話履歴。

## 外部サイトへの組み込み方

コーチングサイトのフロントエンドから直接 `POST /api/coach/chat` を呼び出せます。

```js
const res = await fetch("https://your-coach-ai-app.example.com/api/coach/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: "アセントのAサイトでレトプレイしたい時のコツは?",
    conversationId: previousConversationId, // 初回はnullでOK。以降は返却値を使って会話を継続
  }),
});
const { reply, conversationId, usedKnowledge } = await res.json();
```

- レスポンスの `usedKnowledge` には、回答の根拠として参照した知識エントリのタイトル・カテゴリが含まれます(引用元の提示や透明性のために利用できます)。
- 本番運用時は `COACH_API_ALLOWED_ORIGIN` を必ずコーチングサイトのオリジンに限定してください(未設定だと誰でもAPIを呼べてAnthropicの利用料を消費されてしまいます)。
- もっとも単純な組み込み方法は、`/coach` ページ自体を `<iframe>` でコーチングサイトに埋め込むことです。

## 既知の制約 / 今後の拡張候補

- 検索はBM25(+日本語Bigram)によるキーワードマッチで、意味的な類似検索(embeddings)ではありません。知識量が増えたら実ベクトル検索への切り替えを検討してください。
- 認証機構がないため、複数人でナレッジベースを編集する運用には認可の仕組みの追加が必要です。
- 「知識を教える」チャットのセッション一覧・再開UIは未実装です(DBには保存されているため、APIレベルでは対応可能)。
- `npm audit` で prisma の開発時依存(`deepmerge-ts`)に関する high severity の指摘が出ますが、実行時のAPIサーフェスには影響しない設定マージ処理の依存であり、Prisma 7系を維持する限り現状は許容しています。Prisma 6系へのダウングレードで解消できますが、本プロジェクトの `prisma-client` ジェネレータ構文は7系前提のため未対応です。
