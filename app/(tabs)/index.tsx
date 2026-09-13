import { Link } from 'expo-router';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark } from '@/src/components/BrandMark';
import { Card } from '@/src/components/Card';
import { PracticeTile } from '@/src/components/practice/PracticeTile';
import { AppIcon } from '@/src/components/ui/AppIcon';
import { Button } from '@/src/components/ui/Button';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { Tag } from '@/src/components/ui/Tag';
import { practices } from '@/src/data/practices';
import { homeHeroImage } from '@/src/data/practiceVisuals';
import { PracticeType, practiceTypes } from '@/src/domain/practice';
import { playerLevels } from '@/src/domain/playerProfile';
import {
  activitiesInPracticeWeek,
  recommendNextPractice,
} from '@/src/domain/practicePlan';
import { usePlayerProfile } from '@/src/providers/PlayerProfileProvider';
import { usePracticeActivity } from '@/src/providers/PracticeActivityProvider';
import { colors, radius, shadows } from '@/src/theme';

const recommendationCopy: Record<PracticeType, { title: string; note: string }> = {
  serve: { title: 'Build a serve you trust.', note: 'Five reps. One repeatable start.' },
  dink: { title: 'Make the kitchen feel calm.', note: 'Five reps. Softer hands, clearer intent.' },
  drive: { title: 'Create pace without forcing it.', note: 'Five reps. Find clean contact.' },
};

export default function CoachScreen() {
  const { profile } = usePlayerProfile();
  const { activities } = usePracticeActivity();
  const now = new Date();
  const recommendedPractice = recommendNextPractice(profile?.goals ?? [], activities, now);
  const recommendation = recommendationCopy[recommendedPractice];
  const thisWeek = activitiesInPracticeWeek(activities, now);
  const weeklyTarget = profile?.weeklyTarget ?? 3;
  const weeklyProgress = Math.min(100, (thisWeek.length / weeklyTarget) * 100);
  const levelLabel = playerLevels.find((level) => level.id === profile?.level)?.label ?? 'Set your level';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <BrandMark compact />
          <Link href="/(tabs)/profile" asChild>
            <Pressable accessibilityLabel="Open player profile" accessibilityRole="button" style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}>
              <Text style={styles.avatarText}>{profile?.level === 'unsure' ? '?' : levelLabel.replace('+', '')}</Text>
            </Pressable>
          </Link>
        </View>

        <ImageBackground
          imageStyle={styles.heroImage}
          resizeMode="cover"
          source={homeHeroImage}
          style={styles.hero}
        >
          <View style={styles.heroShade} />
          <View style={styles.heroTopRow}>
            <Tag tone="lime">YOUR NEXT 10 MINUTES</Tag>
            <View style={styles.levelPill}>
              <Text maxFontSizeMultiplier={1.5} style={styles.levelPillText}>{levelLabel}</Text>
            </View>
          </View>
          <View style={styles.heroCopy}>
            <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.heroTitle}>{recommendation.title}</Text>
            <Text style={styles.heroNote}>{recommendation.note}</Text>
            <Link href={{ pathname: '/record/[shot]', params: { shot: recommendedPractice } }} asChild>
              <Button icon="videocam" label={`Start ${practices[recommendedPractice].title}`} />
            </Link>
          </View>
        </ImageBackground>

        <View style={styles.section}>
          <View style={styles.sectionInset}>
            <SectionHeader eyebrow="PRACTICE LIBRARY" title="Choose your focus" />
          </View>
          <ScrollView
            contentContainerStyle={styles.practiceRow}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {practiceTypes.map((practiceType) => (
              <PracticeTile key={practiceType} practiceType={practiceType} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionInset}>
            <SectionHeader eyebrow="THIS WEEK" title="Keep the rhythm" />
          </View>
          <Card style={styles.weekCard}>
            <View style={styles.weekTop}>
              <View>
                <Text style={styles.weekCount}>{thisWeek.length}<Text style={styles.weekTarget}> / {weeklyTarget}</Text></Text>
                <Text style={styles.weekLabel}>focused sessions</Text>
              </View>
              <View style={styles.streakIcon}>
                <AppIcon color={colors.primary} name="flame-outline" size={24} />
              </View>
            </View>
            <View
              accessible
              accessibilityLabel="Weekly practice target"
              accessibilityRole="progressbar"
              accessibilityValue={{ max: weeklyTarget, min: 0, now: Math.min(thisWeek.length, weeklyTarget) }}
              style={styles.progressTrack}
            >
              <View style={[styles.progressFill, { width: `${weeklyProgress}%` }]} />
            </View>
            <Text style={styles.weekNote}>
              {thisWeek.length === 0
                ? 'Your first session starts the week.'
                : thisWeek.length >= weeklyTarget
                  ? 'Weekly target complete. Nice work.'
                  : `${weeklyTarget - thisWeek.length} more to hit your target.`}
            </Text>
          </Card>
        </View>

        <View style={styles.coachNote}>
          <View style={styles.coachIcon}>
            <AppIcon color={colors.text} name="sparkles" size={22} />
          </View>
          <View style={styles.coachCopy}>
            <Text style={styles.coachEyebrow}>COACH NOTE</Text>
            <Text style={styles.coachTitle}>Train one thing until it feels boring.</Text>
            <Text style={styles.coachBody}>That is usually when it starts becoming reliable.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { paddingBottom: 120, gap: 30 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {
    minWidth: 42,
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  avatarText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  hero: {
    minHeight: 430,
    marginHorizontal: 16,
    borderRadius: radius.xl,
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: 18,
    ...shadows.floating,
  },
  heroImage: { borderRadius: radius.xl },
  heroShade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(4, 15, 9, 0.38)',
  },
  heroTopRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  levelPill: {
    borderRadius: radius.pill,
    backgroundColor: 'rgba(8,20,13,0.56)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  levelPillText: { color: colors.white, fontSize: 11, fontWeight: '900' },
  heroCopy: { gap: 11 },
  heroTitle: {
    color: colors.white,
    fontSize: 39,
    lineHeight: 42,
    fontWeight: '900',
    letterSpacing: -1.5,
    maxWidth: 335,
  },
  heroNote: { color: 'rgba(255,255,255,0.88)', fontSize: 14, lineHeight: 20, fontWeight: '600', marginBottom: 3 },
  section: { gap: 15 },
  sectionInset: { paddingHorizontal: 20 },
  practiceRow: { gap: 13, paddingHorizontal: 18, paddingBottom: 8 },
  weekCard: { marginHorizontal: 18, gap: 15, backgroundColor: colors.primaryMist },
  weekTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weekCount: { color: colors.text, fontSize: 38, fontWeight: '900', letterSpacing: -1.2 },
  weekTarget: { color: colors.subtle, fontSize: 22, fontWeight: '700' },
  weekLabel: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  streakIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { height: 9, borderRadius: 5, overflow: 'hidden', backgroundColor: '#D2E7DC' },
  progressFill: { height: '100%', borderRadius: 5, backgroundColor: colors.primaryBright },
  weekNote: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  coachNote: {
    marginHorizontal: 18,
    borderRadius: radius.lg,
    padding: 20,
    flexDirection: 'row',
    gap: 15,
    backgroundColor: colors.accent,
  },
  coachIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.52)', alignItems: 'center', justifyContent: 'center' },
  coachCopy: { flex: 1, gap: 5 },
  coachEyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  coachTitle: { color: colors.text, fontSize: 19, lineHeight: 23, fontWeight: '900', letterSpacing: -0.4 },
  coachBody: { color: colors.text, opacity: 0.72, fontSize: 13, lineHeight: 18 },
  pressed: { opacity: 0.7 },
});
