import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
        tabBarHideOnKeyboard: true,
        headerStyle: {
          backgroundColor: '#f8fafc',
        },
        headerTitleStyle: {
          fontWeight: '700',
        },
        tabBarStyle: {
          height: 62,
          paddingBottom: 6,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="lessons"
        options={{
          title: 'Lições',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="tutor"
        options={{
          title: 'Conversa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="review"
        options={{
          title: 'Revisão',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="refresh-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progresso',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="lesson/[id]"
        options={{
          title: 'Detalhe da Lição',
          href: null,
        }}
      />
    </Tabs>
  );
}
