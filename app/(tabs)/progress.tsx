import { Link } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/src/components/Card';
import { AppIcon } from '@/src/components/ui/AppIcon';
import { Button } from '@/src/components/ui/Button';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { Tag } from '@/src/components/ui/Tag';
import { practices } from '@/src/data/practices';
import { PracticeType, practiceTypes } from '@/src/domain/practice';
import { getPracticeWeekDays, isSameLocalDay } from '@/src/domain/practicePlan';
import { formatRecordingDuration } from '@/src/domain/recordedPracticeSession';
import { usePracticeActivity } from '@/src/providers/PracticeActivityProvider';
import { colors, radius } from '@/src/theme';

function formatActivityDate(value: string) {
  const date = new Date(value);
  const today = new Date();
  if (isSameLocalDay(date, today)) {
    return 'Today';
  }
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

export default function ProgressScreen() {
  const { activities, isLoading } = usePracticeActivity();
  const weekDays = getPracticeWeekDays();
  const totalSeconds = activities.reduce((total, activity) => total + activity.duration, 0);
  const minuteLabel = totalSeconds < 60 ? '<1' : String(Math.round(totalSeconds / 60));
  const skillCounts = practiceTypes.reduce<Record<PracticeType, number>>(
    (counts, practiceType) => ({
      ...counts,
      [practiceType]: activities.filter((activity) => activity.practiceType === practiceType).length,
    }),
    { serve: 0, dink: 0, drive: 0 },
  );
  const largestCount = Math.max(1, ...Object.values(skillCounts));

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primaryBright} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCopy}>
          <Text maxFontSizeMultiplier={1.5} style={styles.kicker}>YOUR PRACTICE</Text>
          <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.title}>Small reps add up.</Text>
          <Text style={styles.subtitle}>Only completed practice sessions appear here. Technique scores stay off until pose tracking is real.</Text>
        </View>

        {activities.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <AppIcon color={colors.primary} name="analytics-outline" size={34} />
            </View>
            <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.emptyTitle}>Your first baseline starts with five reps.</Text>
            <Text style={styles.emptyBody}>Choose one skill and record a clean, full-body set.</Text>
            <Link href={{ pathname: '/record/[shot]', params: { shot: 'serve' } }} asChild>
              <Button icon="videocam" label="Record a Serve" />
            </Link>
          </Card>
        ) : (
          <>
            <View style={styles.statRow}>
              <Card style={styles.statCard}>
                <Text style={styles.statValue}>{activities.length}</Text>
                <Text style={styles.statLabel}>sessions</Text>
              </Card>
              <Card style={[styles.statCard, styles.limeCard]}>
                <Text style={styles.statValue}>{minuteLabel}</Text>
                <Text style={styles.statLabel}>minutes</Text>
              </Card>
            </View>

            <Card style={styles.weekCard}>
              <SectionHeader eyebrow="THIS WEEK" title="Showing up" />
              <View style={styles.dayRow}>
                {weekDays.map((day) => {
                  const completed = activities.some((activity) => isSameLocalDay(new Date(activity.capturedAt), day));
                  return (
                    <View
                      key={day.toISOString()}
                      accessible
                      accessibilityLabel={`${new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(day)}, ${completed ? 'practice completed' : 'no completed practice'}`}
                      style={styles.dayColumn}
                    >
                      <View style={[styles.dayDot, completed && styles.dayDotComplete]}>
                        {completed ? <AppIcon color={colors.ink} name="checkmark" size={14} /> : null}
                      </View>
                      <Text style={styles.dayLabel}>{new Intl.DateTimeFormat(undefined, { weekday: 'narrow' }).format(day)}</Text>
                    </View>
                  );
                })}
              </View>
            </Card>

            <View style={styles.section}>
              <SectionHeader eyebrow="MIX" title="Skills practiced" />
              <Card style={styles.skillCard}>
                {practiceTypes.map((practiceType) => (
                  <View
                    key={practiceType}
                    accessible
                    accessibilityLabel={`${practices[practiceType].title}, ${skillCounts[practiceType]} completed ${skillCounts[practiceType] === 1 ? 'session' : 'sessions'}`}
                    accessibilityRole="progressbar"
                    accessibilityValue={{ max: largestCount, min: 0, now: skillCounts[practiceType] }}
                    style={styles.skillRow}
                  >
                    <Text style={styles.skillName}>{practices[practiceType].title}</Text>
                    <View style={styles.skillTrack}>
                      <View style={[styles.skillFill, { width: `${(skillCounts[practiceType] / largestCount) * 100}%` }]} />
                    </View>
                    <Text style={styles.skillCount}>{skillCounts[practiceType]}</Text>
                  </View>
                ))}
              </Card>
            </View>

            <View style={styles.section}>
              <SectionHeader eyebrow="HISTORY" title="Recent sessions" />
              <View style={styles.historyList}>
                {activities.slice(0, 8).map((activity) => (
                  <Card key={activity.id} style={styles.historyCard}>
                    <View style={styles.historyIcon}>
                      <AppIcon color={colors.primary} name="videocam-outline" size={22} />
                    </View>
                    <View style={styles.historyCopy}>
                      <Text style={styles.historyTitle}>{practices[activity.practiceType].title}</Text>
                      <Text style={styles.historyMeta}>{formatActivityDate(activity.capturedAt)} · {formatRecordingDuration(activity.duration)}</Text>
                    </View>
                    <Tag tone="neutral">CAPTURED</Tag>
                  </Card>
                ))}
              </View>
            </View>
          </>
        )}

        <View style={styles.measurementCard}>
          <View style={styles.measurementIcon}>
            <AppIcon color={colors.text} name="body-outline" size={25} />
          </View>
          <View style={styles.measurementCopy}>
            <Text style={styles.measurementEyebrow}>MEASUREMENT PIPELINE</Text>
            <Text style={styles.measurementTitle}>Measured progress, not guessed progress.</Text>
            <Text style={styles.measurementBody}>Landmark tracking is now in validation. Until its quality is proven on controlled clips, this screen tracks practice—not technique.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  container: { padding: 20, paddingBottom: 120, gap: 24 },
  heroCopy: { gap: 8, paddingTop: 8 },
  kicker: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 40, lineHeight: 43, fontWeight: '900', letterSpacing: -1.6 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, maxWidth: 350 },
  emptyCard: { minHeight: 355, justifyContent: 'center', gap: 15, backgroundColor: colors.primaryMist },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: colors.text, fontSize: 27, lineHeight: 31, fontWeight: '900', letterSpacing: -0.8, maxWidth: 315 },
  emptyBody: { color: colors.muted, fontSize: 14, lineHeight: 21, marginBottom: 5 },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { flexGrow: 1, flexBasis: 150, minHeight: 130, justifyContent: 'flex-end', backgroundColor: colors.primarySoft },
  limeCard: { backgroundColor: colors.accentSoft },
  statValue: { color: colors.text, fontSize: 38, fontWeight: '900', letterSpacing: -1.2 },
  statLabel: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  weekCard: { gap: 22 },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayColumn: { alignItems: 'center', gap: 7 },
  dayDot: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  dayDotComplete: { borderColor: colors.primaryBright, backgroundColor: colors.primaryBright },
  dayLabel: { color: colors.muted, fontSize: 11, fontWeight: '800' },
  section: { gap: 13 },
  skillCard: { gap: 17 },
  skillRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skillName: { minWidth: 54, flexShrink: 1, color: colors.text, fontSize: 14, fontWeight: '800' },
  skillTrack: { flex: 1, height: 9, overflow: 'hidden', borderRadius: 5, backgroundColor: colors.surfaceMuted },
  skillFill: { height: '100%', borderRadius: 5, backgroundColor: colors.primaryBright },
  skillCount: { width: 22, color: colors.text, fontSize: 14, fontWeight: '900', textAlign: 'right' },
  historyList: { gap: 10 },
  historyCard: { minHeight: 76, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  historyCopy: { flex: 1, gap: 3 },
  historyTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  historyMeta: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  measurementCard: { borderRadius: radius.lg, padding: 19, flexDirection: 'row', gap: 14, backgroundColor: colors.accent },
  measurementIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.52)', alignItems: 'center', justifyContent: 'center' },
  measurementCopy: { flex: 1, gap: 5 },
  measurementEyebrow: { color: colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  measurementTitle: { color: colors.text, fontSize: 17, lineHeight: 21, fontWeight: '900' },
  measurementBody: { color: colors.text, opacity: 0.72, fontSize: 12, lineHeight: 17 },
});
