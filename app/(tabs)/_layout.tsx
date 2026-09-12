import { Tabs } from 'expo-router';
import { ColorValue, Text } from 'react-native';
import { colors } from '@/src/theme';

const Icon = ({ value, color }: { value: string; color: ColorValue }) => (
  <Text style={{ fontSize: 18, color }}>{value}</Text>
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { borderTopColor: colors.border, backgroundColor: colors.surface },
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '800' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Coach', tabBarIcon: ({ color }) => <Icon value="◉" color={color} /> }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress', tabBarIcon: ({ color }) => <Icon value="↗" color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <Icon value="●" color={color} /> }} />
    </Tabs>
  );
}
