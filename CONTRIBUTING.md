# 開発の進め方

## 基本ルール

- **main に直接 push しない。** 必ずブランチを作って Pull Request (PR) を出す
- PR はもう1人がレビューしてからマージする
- 作業を始める前に必ず main を最新にする
- `src/types/todo.ts` (データの形) を変えるときは事前に相談する

## 1つの機能を作る流れ (VS Code)

1. **Issue を選ぶ** — GitHub の Issues から担当の Issue を開き、Assignees に自分を設定する
2. **main を最新にする**
   ```bash
   git checkout main
   git pull
   ```
3. **ブランチを作る** (名前は `feature/内容` にする)
   ```bash
   git checkout -b feature/todo-edit
   ```
   VS Code なら左下のブランチ名をクリック → 「新しいブランチの作成」でもOK
4. **コードを書いて、こまめにコミットする**
   VS Code 左の「ソース管理」(枝分かれのアイコン) → 変更の横の `+` → メッセージを書いて「コミット」
5. **push する** — 「ソース管理」の「ブランチの発行」または `git push -u origin feature/todo-edit`
6. **PR を作る** — GitHub を開くと「Compare & pull request」ボタンが出るので押す。本文に `Closes #Issue番号` と書くと、マージ時に Issue が自動で閉じる
7. **レビューしてもらう** — Reviewers に相手を設定する。指摘があれば同じブランチで直して push
8. **マージしたら** 手順 2 に戻る

## 相手のコードを確認する方法

- **GitHub 上で見る**: PR の「Files changed」タブで変更点が見られる。行の横の `+` でコメントできる
- **VS Code で見る**: 拡張機能「GitHub Pull Requests」を入れると、VS Code の左側から PR の一覧・差分・コメントが見られる
- **実際に動かして見る**
  ```bash
  git fetch
  git checkout feature/相手のブランチ名
  npm install
  npm run web
  ```

## コミットメッセージ

日本語でOK。「何をしたか」が分かるように書く。

- 良い例: `Todoの削除ボタンを追加`
- 悪い例: `修正`、`update`

## 困ったとき

- **コンフリクト (競合) が出た** → VS Code が競合箇所を色付きで表示するので、「現在の変更を取り込む / 入力側の変更を取り込む / 両方」を選んで保存 → コミット。分からなければ相手に連絡
- **npm install でエラー** → `node_modules` フォルダを消してもう一度 `npm install`
