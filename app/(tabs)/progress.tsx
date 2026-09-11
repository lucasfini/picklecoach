import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/src/components/Card';
import { ScoreBar } from '@/src/components/ScoreBar';
import { colors } from '@/src/theme';

const skills = [['Serve', 76], ['Dink', 69], ['Drive', 81], ['Footwork', 63]] as const;
const sessions = [
  { date: 'Today', skill: 'Serve', score: 72, change: '+6' },
  { date: 'Sep 8', skill: 'Serve', score: 66, change: '+3' },
  { date: 'Sep 4', skill: 'Drive', score: 81, change: '+5' },
];

export default function ProgressScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>Your game is moving.</Text>
        <Text style={styles.subtitle}>Progress should feel obvious, not buried in a spreadsheet nobody asked for.</Text>
      </View>

      <Card style={styles.summaryCard}>
        <Text style={styles.label}>LAST 30 DAYS</Text>
        <View style={styles.statsRow}>
          <View><Text style={styles.bigNumber}>8</Text><Text style={styles.small}>sessions</Text></View>
          <View><Text style={styles.bigNumber}>+11</Text><Text style={styles.small}>serve points</Text></View>
          <View><Text style={styles.bigNumber}>3</Text><Text style={styles.small}>skills trained</Text></View>
        </View>
      </Card>

      <Card style={styles.cardGap}>
        <Text style={styles.cardTitle}>Skill profile</Text>
        <View style={styles.skillList}>{skills.map(([label, score]) => <ScoreBar key={label} label={label} score={score} />)}</View>
      </Card>

      <View style={styles.sectionHeader}><Text style={styles.cardTitle}>Recent sessions</Text></View>
      {sessions.map((session) => (
        <Card key={`${session.date}-${session.skill}`} style={styles.sessionCard}>
          <View><Text style={styles.sessionSkill}>{session.skill}</Text><Text style={styles.small}>{session.date}</Text></View>
          <View style={styles.sessionRight}><Text style={styles.sessionScore}>{session.score}</Text><Text style={styles.change}>{session.change}</Text></View>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, paddingBottom: 40, gap: 14, backgroundColor: colors.background },
  hero: { gap: 7, paddingVertical: 8 },
  title: { color: colors.text, fontSize: 31, lineHeight: 36, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  summaryCard: { backgroundColor: colors.primarySoft, borderColor: '#CDE2D0', gap: 14 },
  label: { color: colors.primary, fontSize: 11, letterSpacing: 1.5, fontWeight: '900' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  bigNumber: { color: colors.text, fontSize: 27, fontWeight: '900' },
  small: { color: colors.muted, fontSize: 12 },
  cardGap: { gap: 18 },
  cardTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  skillList: { gap: 17 },
  sectionHeader: { marginTop: 8 },
  sessionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sessionSkill: { color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 3 },
  sessionRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sessionScore: { color: colors.text, fontSize: 22, fontWeight: '900' },
  change: { color: colors.primary, fontSize: 13, fontWeight: '900' },
});
