import { Todo } from '../types/todo';

/** 'YYYY-MM-DD' をその日の 0時の Date に変換する。形式が違うときは null */
export function parseDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** 今日から期限まであと何日か (今日なら 0、過ぎていればマイナス) */
export function daysUntil(dueDate: string, today: Date = new Date()): number | null {
  const due = parseDate(dueDate);
  if (!due) return null;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((due.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}

/** 画面表示用。'2026-10-05' → '10/5' */
export function formatShortDate(dueDate: string): string {
  const d = parseDate(dueDate);
  return d ? `${d.getMonth() + 1}/${d.getDate()}` : dueDate;
}

/** 期限が近い順に並べる。期限なしは最後 */
export function sortByDueDate(todos: Todo[]): Todo[] {
  return [...todos].sort((a, b) => {
    if (!a.dueDate) return b.dueDate ? 1 : 0;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });
}
