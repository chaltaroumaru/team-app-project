import { useCallback, useEffect, useState } from 'react';
import { Todo, TodoInput } from '../types/todo';
import { loadTodos, saveTodos } from './todoStorage';

function makeId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Todo の読み込み・追加・編集・削除をまとめたフック。
 * 画面からはこのフックだけを使い、AsyncStorage を直接さわらないこと。
 *
 * 使い方:
 *   const { todos, addTodo, updateTodo, removeTodo, toggleDone } = useTodos();
 */
export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodos().then((list) => {
      setTodos(list);
      setLoading(false);
    });
  }, []);

  /** 画面の状態と保存データを同時に更新する */
  const persist = useCallback((updater: (prev: Todo[]) => Todo[]) => {
    setTodos((prev) => {
      const next = updater(prev);
      saveTodos(next);
      return next;
    });
  }, []);

  const addTodo = useCallback(
    (input: TodoInput): Todo => {
      const todo: Todo = {
        ...input,
        id: makeId(),
        done: false,
        createdAt: new Date().toISOString(),
      };
      persist((prev) => [todo, ...prev]);
      return todo;
    },
    [persist]
  );

  const updateTodo = useCallback(
    (id: string, changes: Partial<Omit<Todo, 'id'>>) => {
      persist((prev) => prev.map((t) => (t.id === id ? { ...t, ...changes } : t)));
    },
    [persist]
  );

  const removeTodo = useCallback(
    (id: string) => {
      persist((prev) => prev.filter((t) => t.id !== id));
    },
    [persist]
  );

  const toggleDone = useCallback(
    (id: string) => {
      persist((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
    },
    [persist]
  );

  return { todos, loading, addTodo, updateTodo, removeTodo, toggleDone };
}
