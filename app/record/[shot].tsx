import { Link, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/src/components/Card';
import { ShotType, shots } from '@/src/data/mock';
import { colors, radius } from '@/src/theme';

export default function RecordScreen() {
  const { shot: rawShot } = useLocalSearchParams<{ shot: string }>();
  const shot = (rawShot in shots ? rawShot : 'serve') as ShotType;
  const item = shots[shot];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{item.emoji}</Text>
        <Text style={styles.title}>{item.title} practice</Text>
        <Text style={styles.subtitle}>We’ll start with 5 repetitions. Quality beats filming half your afternoon.</Text>
      </View>

      <Card style={styles.cameraCard}>
        <View style={styles.cameraPlaceholder}>
          <Text style={styles.cameraIcon}>▣</Text>
          <Text style={styles.cameraText}>Camera preview</Text>
          <Text style={styles.cameraSmall}>Computer-vision capture is the next implementation milestone.</Text>
        </View>
      </Card>

      <Card>
        <Text style={styles.label}>CAMERA SETUP</Text>
        <Text style={styles.instructions}>{item.camera}</Text>
      </Card>

      <View style={styles.steps}>
        {[
          ['1', 'Full body visible', 'Keep your feet, paddle, and contact point inside the frame.'],
          ['2', 'Record 5 reps', 'Use your normal technique. We want your real swing, not your audition swing.'],
          ['3', 'Get one priority', 'We’ll surface the correction most likely to improve this skill next.'],
        ].map(([n, title, body]) => (
          <View key={n} style={styles.stepRow}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{n}</Text></View>
            <View style={{ flex: 1 }}><Text style={styles.stepTitle}>{title}</Text><Text style={styles.stepBody}>{body}</Text></View>
          </View>
        ))}
      </View>

      <Link href={{ pathname: '/analysis/[shot]', params: { shot } }} style={styles.button}>
        Use demo recording
      </Link>
      <Text style={styles.demoNote}>The demo path lets us validate the product experience before wiring pose estimation into recording.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, paddingBottom: 40, gap: 14, backgroundColor: colors.background },
  header: { alignItems: 'center', gap: 6, paddingVertical: 10 },
  emoji: { fontSize: 34 },
  title: { color: colors.text, fontSize: 30, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: 'center', maxWidth: 340 },
  cameraCard: { padding: 8 },
  cameraPlaceholder: { height: 290, borderRadius: radius.sm, backgroundColor: '#18201A', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  cameraIcon: { color: '#D9F04A', fontSize: 34 },
  cameraText: { color: 'white', fontSize: 18, fontWeight: '800' },
  cameraSmall: { color: '#B8C0B9', fontSize: 13, textAlign: 'center', lineHeight: 18 },
  label: { color: colors.primary, fontSize: 11, letterSpacing: 1.5, fontWeight: '900', marginBottom: 6 },
  instructions: { color: colors.text, fontSize: 16, lineHeight: 23, fontWeight: '600' },
  steps: { gap: 16, paddingVertical: 8 },
  stepRow: { flexDirection: 'row', gap: 12 },
  stepNumber: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  stepNumberText: { color: colors.primary, fontWeight: '900' },
  stepTitle: { color: colors.text, fontWeight: '800', fontSize: 15, marginBottom: 3 },
  stepBody: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  button: { backgroundColor: colors.primary, color: 'white', textAlign: 'center', fontSize: 17, fontWeight: '900', paddingVertical: 16, borderRadius: radius.md, overflow: 'hidden' },
  demoNote: { color: colors.muted, fontSize: 12, lineHeight: 17, textAlign: 'center', paddingHorizontal: 16 },
});
