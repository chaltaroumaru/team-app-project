import { Platform } from 'react-native';
import { Todo } from '../types/todo';

/**
 * 通知・リマインド機能 (Issue「通知・リマインド」で実装する)
 *
 * やること:
 *   - expo-notifications で通知の許可をもらう (requestNotificationPermission)
 *   - Todo の remindAt / dueDate に合わせて通知を予約する (scheduleTodoReminder)
 *   - Todo を削除・完了したら予約を取り消す (cancelTodoReminder)
 *
 * 注意: Web では通知が使えないので Platform.OS === 'web' のときは何もしない。
 * 参考: https://docs.expo.dev/versions/latest/sdk/notifications/
 */

export const isNotificationSupported = Platform.OS !== 'web';

export async function requestNotificationPermission(): Promise<boolean> {
  // TODO: 実装する
  return false;
}

export async function scheduleTodoReminder(_todo: Todo): Promise<void> {
  // TODO: 実装する
}

export async function cancelTodoReminder(_todoId: string): Promise<void> {
  // TODO: 実装する
}
