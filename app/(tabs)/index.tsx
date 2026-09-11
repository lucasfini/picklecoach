import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/src/components/Card';
import { ShotType, shots } from '@/src/data/mock';
import { colors, radius } from '@/src/theme';

export default function CoachScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>PICKLECOACH</Text>
        <Text style={styles.title}>Get better between lessons.</Text>
        <Text style={styles.subtitle}>Record a short practice set. We’ll identify the biggest thing to work on next.</Text>
      </View>

      <Card style={styles.currentPlan}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionEyebrow}>THIS WEEK</Text>
            <Text style={styles.planTitle}>Create more space at contact</Text>
            <Text style={styles.muted}>Serve · Session 2 of 3</Text>
          </View>
          <View style={styles.scoreBubble}><Text style={styles.scoreText}>72</Text></View>
        </View>
      </Card>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Start a practice</Text>
        <Text style={styles.muted}>Pick one skill. Keep it focused.</Text>
      </View>

      {(Object.keys(shots) as ShotType[]).map((key) => {
        const shot = shots[key];
        return (
          <Link key={key} href={{ pathname: '/record/[shot]', params: { shot: key } }} asChild>
            <Card style={styles.shotCard}>
              <View style={styles.shotIcon}><Text style={styles.shotEmoji}>{shot.emoji}</Text></View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.shotTitle}>{shot.title}</Text>
                <Text style={styles.shotDescription}>{shot.description}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Card>
          </Link>
        );
      })}

      <Card style={styles.insightCard}>
        <Text style={styles.sectionEyebrow}>COACH INSIGHT</Text>
        <Text style={styles.insightTitle}>Your balance is becoming a strength.</Text>
        <Text style={styles.muted}>It has improved across your last three practice sessions. Next we’ll focus on follow-through.</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, paddingBottom: 36, gap: 14, backgroundColor: colors.background },
  hero: { paddingTop: 10, paddingBottom: 8, gap: 8 },
  eyebrow: { color: colors.primary, fontWeight: '900', letterSpacing: 1.8, fontSize: 12 },
  title: { fontSize: 36, lineHeight: 40, fontWeight: '900', color: colors.text, maxWidth: 340 },
  subtitle: { color: colors.muted, fontSize: 17, lineHeight: 24, maxWidth: 360 },
  currentPlan: { backgroundColor: colors.primarySoft, borderColor: '#CDE2D0' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  sectionEyebrow: { color: colors.primary, fontSize: 11, letterSpacing: 1.5, fontWeight: '900' },
  planTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginVertical: 5 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  scoreBubble: { width: 62, height: 62, borderRadius: 31, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  scoreText: { color: 'white', fontWeight: '900', fontSize: 22 },
  sectionHeader: { gap: 2, marginTop: 8, marginBottom: 2 },
  sectionTitle: { color: colors.text, fontSize: 22, fontWeight: '900' },
  shotCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  shotIcon: { width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  shotEmoji: { fontSize: 22 },
  shotTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  shotDescription: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  chevron: { color: colors.muted, fontSize: 28 },
  insightCard: { marginTop: 4, gap: 8 },
  insightTitle: { color: colors.text, fontSize: 19, lineHeight: 24, fontWeight: '800' },
});
