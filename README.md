# team-app-project — 就活Todo

2人で共同開発する Todo 管理アプリです。React Native (Expo) + TypeScript 製で、データは端末内 (AsyncStorage) に保存します。

## 機能

| 区分 | 機能                                                                     | 状態                          |
| ---- | ------------------------------------------------------------------------ | ----------------------------- |
| 通常 | Todo を入力してリスト表示                                                | 未着手                        |
| 通常 | 就活タスク (会社名・タスクの内容・期限) をアプリ起動時のホーム画面に表示 | 仮表示のみ                    |
| 通常 | Todo の編集・削除                                                        | 未着手 (データ処理は実装済み) |
| 特殊 | スマホのホーム画面ウィジェットにリストを表示                             | 未着手                        |
| 特殊 | 通知・リマインド                                                         | 未着手                        |

進み具合と担当は GitHub の **Issues** で管理します。

## はじめかた (VS Code)

1. [Git](https://git-scm.com/)、[Node.js (LTS版)](https://nodejs.org/)、[VS Code](https://code.visualstudio.com/) をインストールする
2. VS Code を開き、`Ctrl + Shift + P` (Mac は `Cmd + Shift + P`) → **Git: Clone** → `https://github.com/chaltaroumaru/team-app-project.git` を入力
3. 右下に「おすすめの拡張機能をインストールしますか?」と出たら **インストール** を押す
4. VS Code のターミナル (`Ctrl + @`) で以下を実行する

```bash
npm install
npm run web      # ブラウザで起動
npm start        # スマホの Expo Go で QR コードを読み取って起動
```

## フォルダ構成

```
App.tsx                      画面の切り替え (ホーム / Todo)
src/
  types/todo.ts              Todo のデータの形 ← 変えるときは2人で相談
  storage/todoStorage.ts     端末への保存・読み込み
  storage/useTodos.ts        追加・編集・削除・完了切替のフック (画面からはこれを使う)
  utils/date.ts              期限の計算・並び替え
  notifications/reminder.ts  通知・リマインド (これから実装)
  screens/HomeScreen.tsx     ホーム画面 (就活タスク表示)
  screens/TodoListScreen.tsx Todo 一覧・入力画面
```

## チェックコマンド

Pull Request を出す前に実行してください。

```bash
npm run typecheck   # 型エラーがないか
npm run format      # コードの見た目をそろえる
```

開発の進め方は [CONTRIBUTING.md](CONTRIBUTING.md) を見てください。
