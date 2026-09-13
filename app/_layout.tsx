import { ErrorBoundaryProps, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '@/src/components/ui/AppIcon';
import { Button } from '@/src/components/ui/Button';
import { ActivePracticeSessionProvider } from '@/src/providers/ActivePracticeSessionProvider';
import { PlayerProfileProvider } from '@/src/providers/PlayerProfileProvider';
import { PracticeActivityProvider } from '@/src/providers/PracticeActivityProvider';
import { colors } from '@/src/theme';

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <ScrollView contentContainerStyle={styles.errorScreen} showsVerticalScrollIndicator={false}>
      <StatusBar style="dark" />
      <View style={styles.errorIcon}>
        <AppIcon color={colors.coral} name="alert-circle-outline" size={44} />
      </View>
      <Text maxFontSizeMultiplier={1.5} style={styles.errorEyebrow}>PICKLECOACH TOOK A TIMEOUT</Text>
      <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.errorTitle}>Let’s get you back on court.</Text>
      <Text style={styles.errorBody}>
        This screen did not load correctly. Your practice video was not uploaded.
      </Text>
      {__DEV__ ? <Text style={styles.errorDetail}>{error.message}</Text> : null}
      <Button icon="refresh" label="Try this screen again" onPress={retry} />
    </ScrollView>
  );
}

export default function RootLayout() {
  return (
    <PlayerProfileProvider>
      <PracticeActivityProvider>
        <ActivePracticeSessionProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.background },
              headerShadowVisible: false,
              headerTintColor: colors.text,
              headerBackButtonDisplayMode: 'minimal',
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="record/[shot]" options={{ title: 'Practice setup', presentation: 'card' }} />
            <Stack.Screen name="analysis/[shot]" options={{ title: 'Your analysis' }} />
            <Stack.Screen name="privacy" options={{ title: 'Privacy & data' }} />
            <Stack.Screen name="dev/pose-lab" options={{ title: 'Pose lab' }} />
          </Stack>
        </ActivePracticeSessionProvider>
      </PracticeActivityProvider>
    </PlayerProfileProvider>
  );
}

const styles = StyleSheet.create({
  errorScreen: { flexGrow: 1, justifyContent: 'center', gap: 13, padding: 28, backgroundColor: colors.background },
  errorIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.coralSoft, marginBottom: 8 },
  errorEyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  errorTitle: { color: colors.text, fontSize: 32, lineHeight: 37, fontWeight: '900', letterSpacing: -1 },
  errorBody: { color: colors.muted, fontSize: 14, lineHeight: 21, marginBottom: 5 },
  errorDetail: { color: colors.danger, fontSize: 11, lineHeight: 16, padding: 12, backgroundColor: colors.dangerSoft },
});
