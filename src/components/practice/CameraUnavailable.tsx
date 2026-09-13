import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from '@/src/theme';

type CameraUnavailableProps = {
  isChecking: boolean;
  detail?: string;
  onRetry: () => void;
  onBack: () => void;
};

export function CameraUnavailable({ isChecking, detail, onRetry, onBack }: CameraUnavailableProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>{isChecking ? 'CHECKING CAMERA' : 'CAMERA UNAVAILABLE'}</Text>
        <Text style={styles.title}>{isChecking ? 'Getting the camera ready…' : 'We cannot start the camera.'}</Text>
        <Text style={styles.body}>
          {isChecking
            ? 'This should only take a moment.'
            : detail ?? 'Try again on a physical device with an available rear camera.'}
        </Text>
        {!isChecking ? (
          <Pressable
            accessibilityRole="button"
            onPress={onRetry}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.primaryButtonText}>Try camera again</Text>
          </Pressable>
        ) : null}
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Back to setup</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', padding: 28, gap: 16 },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  title: { color: colors.text, fontSize: 28, lineHeight: 34, fontWeight: '900' },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22, marginBottom: 4 },
  primaryButton: {
    minHeight: 54,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  secondaryButton: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { color: colors.text, fontSize: 15, fontWeight: '800' },
  buttonPressed: { opacity: 0.82 },
});
