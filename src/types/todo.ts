/**
 * アプリ全体で使う Todo のデータの形。
 * 2人で並行して作業するので、項目を増やす・変えるときは必ず相談してから変更すること。
 */

/** normal: ふつうのTodo / jobhunt: 就活タスク */
export type TodoCategory = 'normal' | 'jobhunt';

export type Todo = {
  id: string;
  /** タスクの内容 */
  title: string;
  category: TodoCategory;
  /** 会社名(就活タスクのときだけ使う) */
  company?: string;
  /** 期限。'YYYY-MM-DD' 形式の文字列 */
  dueDate?: string;
  /** 完了したかどうか */
  done: boolean;
  /** 通知する日時。ISO 形式の文字列 (例: '2026-10-05T09:00:00.000Z') */
  remindAt?: string;
  /** 作成日時。ISO 形式の文字列 */
  createdAt: string;
};

/** 新規作成時に入力してもらう項目(id・done・createdAt は自動で付ける) */
export type TodoInput = Omit<Todo, 'id' | 'done' | 'createdAt'>;
