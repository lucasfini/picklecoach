import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/src/components/Card';
import { PracticeDefinition } from '@/src/data/practices';
import { colors, radius } from '@/src/theme';

type CameraSetupProps = {
  practice: PracticeDefinition;
  onContinue: () => void;
};

export function CameraSetup({ practice, onContinue }: CameraSetupProps) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{practice.emoji}</Text>
        <Text style={styles.title}>{practice.title} practice</Text>
        <Text style={styles.subtitle}>
          Record 5 natural repetitions in one clip. The recording stops automatically at 30 seconds.
        </Text>
      </View>

      <View style={styles.preview}>
        <View style={styles.frameGuide}>
          <View style={styles.headGuide} />
          <View style={styles.bodyGuide} />
          <View style={styles.legGuide} />
        </View>
        <Text style={styles.previewLabel}>FULL BODY IN FRAME</Text>
      </View>

      <Card style={styles.instructionsCard}>
        <Text style={styles.label}>PHONE SETUP</Text>
        <Text style={styles.summary}>{practice.cameraSummary}</Text>
        <View style={styles.instructions}>
          {practice.cameraInstructions.map((instruction, index) => (
            <View key={instruction} style={styles.instructionRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.instruction}>{instruction}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Pressable
        accessibilityRole="button"
        onPress={onContinue}
        style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
      >
        <Text style={styles.primaryButtonText}>Continue to camera</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    paddingBottom: 40,
    gap: 16,
    backgroundColor: colors.background,
  },
  header: { alignItems: 'center', gap: 7, paddingTop: 6 },
  emoji: { fontSize: 34 },
  title: { color: colors.text, fontSize: 30, fontWeight: '900' },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 350,
  },
  preview: {
    height: 220,
    borderRadius: radius.md,
    backgroundColor: '#18201A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    overflow: 'hidden',
  },
  frameGuide: {
    height: 150,
    width: 84,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headGuide: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  bodyGuide: {
    width: 2,
    height: 54,
    backgroundColor: colors.accent,
  },
  legGuide: {
    width: 42,
    height: 42,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: colors.accent,
  },
  previewLabel: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  instructionsCard: { gap: 8 },
  label: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  summary: { color: colors.text, fontSize: 18, lineHeight: 24, fontWeight: '800' },
  instructions: { gap: 12, marginTop: 8 },
  instructionRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  instruction: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20 },
  primaryButton: {
    minHeight: 54,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  buttonPressed: { opacity: 0.82 },
});
