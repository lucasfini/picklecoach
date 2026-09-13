import { Tabs } from 'expo-router';
import { ColorValue } from 'react-native';
import { AppIcon, AppIconName } from '@/src/components/ui/AppIcon';
import { colors, shadows } from '@/src/theme';

function TabIcon({ color, focused, name }: { color: ColorValue; focused: boolean; name: AppIconName }) {
  return <AppIcon color={color} name={focused ? name : `${name}-outline` as AppIconName} size={23} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtle,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '800', marginTop: 3 },
        tabBarStyle: {
          height: 84,
          paddingTop: 9,
          paddingBottom: 10,
          borderTopWidth: 0,
          backgroundColor: colors.surface,
          ...shadows.floating,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name="home" />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name="stats-chart" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'You',
          tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name="person" />,
        }}
      />
    </Tabs>
  );
}
