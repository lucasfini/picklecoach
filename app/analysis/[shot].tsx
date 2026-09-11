import { Link, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/src/components/Card';
import { ScoreBar } from '@/src/components/ScoreBar';
import { mockResults, ShotType, shots } from '@/src/data/mock';
import { colors, radius } from '@/src/theme';

export default function AnalysisScreen() {
  const { shot: rawShot } = useLocalSearchParams<{ shot: string }>();
  const shot = (rawShot in shots ? rawShot : 'serve') as ShotType;
  const item = shots[shot];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.scoreWrap}>
        <Text style={styles.label}>{item.title.toUpperCase()} SCORE</Text>
        <View style={styles.scoreCircle}><Text style={styles.score}>{mockResults.overall}</Text><Text style={styles.outOf}>/100</Text></View>
        <Text style={styles.improved}>↑ 6 points from your baseline</Text>
      </View>

      <Card style={styles.priorityCard}>
        <Text style={styles.label}>BIGGEST OPPORTUNITY</Text>
        <Text style={styles.priority}>{mockResults.biggestOpportunity}</Text>
        <Text style={styles.body}>Your balance is solid, but the contact point is getting crowded. Fixing spacing first should make the rest of the motion easier.</Text>
      </Card>

      <Card style={styles.metricCard}>
        <Text style={styles.cardTitle}>Technique breakdown</Text>
        <View style={styles.metrics}>
          {mockResults.metrics.map(([label, score]) => <ScoreBar key={label} label={label} score={score} />)}
        </View>
      </Card>

      <Card style={styles.drillCard}>
        <Text style={styles.label}>5-MINUTE DRILL</Text>
        <Text style={styles.cardTitle}>Give yourself room at contact</Text>
        <Text style={styles.body}>{mockResults.drill}</Text>
      </Card>

      <Link href={{ pathname: '/record/[shot]', params: { shot } }} style={styles.primaryButton}>Practice it again</Link>
      <Link href="/(tabs)/progress" style={styles.secondaryButton}>View progress</Link>
      <Text style={styles.disclaimer}>Demo analysis only. Production coaching scores must be grounded in measured pose/video features, not generated guesses.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, paddingBottom: 42, gap: 14, backgroundColor: colors.background },
  scoreWrap: { alignItems: 'center', gap: 8, paddingVertical: 12 },
  label: { color: colors.primary, fontSize: 11, letterSpacing: 1.5, fontWeight: '900' },
  scoreCircle: { width: 134, height: 134, borderRadius: 67, backgroundColor: colors.primary, alignItems: 'baseline', justifyContent: 'center', flexDirection: 'row', paddingTop: 42 },
  score: { color: 'white', fontSize: 50, fontWeight: '900' },
  outOf: { color: '#D7E5D9', fontSize: 14, fontWeight: '700' },
  improved: { color: colors.primary, fontWeight: '800', fontSize: 14 },
  priorityCard: { backgroundColor: colors.primarySoft, borderColor: '#CDE2D0', gap: 8 },
  priority: { color: colors.text, fontSize: 23, lineHeight: 29, fontWeight: '900' },
  body: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  metricCard: { gap: 18 },
  cardTitle: { color: colors.text, fontSize: 19, lineHeight: 24, fontWeight: '900' },
  metrics: { gap: 16 },
  drillCard: { gap: 8 },
  primaryButton: { backgroundColor: colors.primary, color: 'white', textAlign: 'center', fontSize: 17, fontWeight: '900', paddingVertical: 16, borderRadius: radius.md, overflow: 'hidden' },
  secondaryButton: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, textAlign: 'center', fontSize: 16, fontWeight: '800', paddingVertical: 15, borderRadius: radius.md, overflow: 'hidden' },
  disclaimer: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: 'center', paddingHorizontal: 12 },
});
