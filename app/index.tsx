import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { shouldAutostartPoseLab } from '@/src/config/featureFlags';
import { usePlayerProfile } from '@/src/providers/PlayerProfileProvider';
import { colors } from '@/src/theme';

export default function Index() {
  const { isLoading, profile } = usePlayerProfile();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primaryBright} size="large" />
      </View>
    );
  }

  return <Redirect href={shouldAutostartPoseLab ? '/dev/pose-lab' : profile ? '/(tabs)' : '/onboarding'} />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
