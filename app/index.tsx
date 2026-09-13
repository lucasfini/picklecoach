import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { usePlayerProfile } from '@/src/providers/PlayerProfileProvider';
import { colors } from '@/src/theme';

export default function Index() {
  const { isLoading, profile } = usePlayerProfile();
  const shouldOpenPoseLab = __DEV__ && process.env.EXPO_PUBLIC_POSE_LAB_AUTOSTART === '1';

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primaryBright} size="large" />
      </View>
    );
  }

  return <Redirect href={shouldOpenPoseLab ? '/dev/pose-lab' : profile ? '/(tabs)' : '/onboarding'} />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
