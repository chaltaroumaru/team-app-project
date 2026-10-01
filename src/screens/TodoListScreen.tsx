import { StyleSheet, Text, View } from 'react-native';
import { useTodos } from '../storage/useTodos';

type Props = ReturnType<typeof useTodos>;

/**
 * Todo 一覧画面
 * Issue「Todoの入力・一覧表示」「Todoの編集・削除」で作り込む。
 *
 * やること:
 *   - 入力欄からTodoを追加する (addTodo)。就活タスクなら会社名・期限も入力する
 *   - 一覧で表示し、タップで完了/未完了を切り替える (toggleDone)
 *   - 編集 (updateTodo) と削除 (removeTodo)
 */
export function TodoListScreen({ todos }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Todoリスト</Text>
      {/* TODO: 入力フォームと一覧を作る */}
      {todos.map((t) => (
        <Text key={t.id}>
          {t.done ? '✓ ' : '・'}
          {t.title}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  heading: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
});
