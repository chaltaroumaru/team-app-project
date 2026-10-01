import AsyncStorage from '@react-native-async-storage/async-storage';
import { Todo } from '../types/todo';

/** 端末内に保存するときのキー。変えると今までのデータが読めなくなるので注意 */
const STORAGE_KEY = 'team-todo-app/todos';

/** 保存されている Todo を全部読み込む。読めなかったときは空の配列を返す */
export async function loadTodos(): Promise<Todo[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Todo の一覧をまるごと保存する */
export async function saveTodos(todos: Todo[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}
