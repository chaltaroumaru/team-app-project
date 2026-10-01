import { StyleSheet, Text, View } from 'react-native';
import { Todo } from '../types/todo';
import { sortByDueDate } from '../utils/date';

type Props = {
  todos: Todo[];
};

/**
 * ホーム画面 (アプリを開いたとき最初に出る画面)
 * Issue「就活タスクをホーム画面に表示」で作り込む。
 *
 * やること:
 *   - 就活タスク (category === 'jobhunt') を期限が近い順に表示する
 *   - 「会社名」「タスクの内容」「期限」を表示する
 *   - 期限切れ・今日が期限のものは目立たせる
 */
export function HomeScreen({ todos }: Props) {
  const jobhuntTodos = sortByDueDate(todos.filter((t) => t.category === 'jobhunt' && !t.done));

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>就活タスク</Text>
      {/* TODO: 下は仮表示。カードのデザインに置き換える */}
      {jobhuntTodos.length === 0 ? (
        <Text>就活タスクはまだありません</Text>
      ) : (
        jobhuntTodos.map((t) => (
          <Text key={t.id}>
            {t.company ?? '(会社名なし)'} / {t.title} / {t.dueDate ?? '期限なし'}
          </Text>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  heading: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
});
