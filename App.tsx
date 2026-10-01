import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTodos } from './src/storage/useTodos';
import { HomeScreen } from './src/screens/HomeScreen';
import { TodoListScreen } from './src/screens/TodoListScreen';

type Tab = 'home' | 'todos';

const TABS: { key: Tab; label: string }[] = [
  { key: 'home', label: 'ホーム' },
  { key: 'todos', label: 'Todo' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  // データはここで1回だけ読み込み、各画面に渡す(画面ごとに useTodos を呼ぶと内容がずれるため)
  const todoStore = useTodos();

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root}>
        <View style={styles.content}>
          {tab === 'home' ? (
            <HomeScreen todos={todoStore.todos} />
          ) : (
            <TodoListScreen {...todoStore} />
          )}
        </View>
        <View style={styles.tabBar}>
          {TABS.map((t) => (
            <Pressable key={t.key} style={styles.tab} onPress={() => setTab(t.key)}>
              <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <StatusBar style="auto" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1 },
  tabBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#ddd' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabLabel: { fontSize: 14, color: '#888' },
  tabLabelActive: { color: '#3b6fe0', fontWeight: 'bold' },
});
