import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark } from '@/src/components/BrandMark';
import { AppIcon, AppIconName } from '@/src/components/ui/AppIcon';
import { Button } from '@/src/components/ui/Button';
import { homeHeroImage } from '@/src/data/practiceVisuals';
import {
  playerGoals,
  PlayerGoal,
  playerLevels,
  PlayerLevel,
} from '@/src/domain/playerProfile';
import { usePlayerProfile } from '@/src/providers/PlayerProfileProvider';
import { colors, radius, shadows } from '@/src/theme';

type OnboardingStep = 'welcome' | 'level' | 'goals';

export default function OnboardingScreen() {
  const router = useRouter();
  const { fontScale, width } = useWindowDimensions();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { profile, saveProfile } = usePlayerProfile();
  const isEditing = mode === 'edit' && Boolean(profile);
  const [step, setStep] = useState<OnboardingStep>(isEditing ? 'level' : 'welcome');
  const [level, setLevel] = useState<PlayerLevel | null>(profile?.level ?? null);
  const [goals, setGoals] = useState<PlayerGoal[]>(profile?.goals ?? ['consistency']);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const useSingleColumnLevels = fontScale >= 1.25 || width < 370;

  const stepNumber = step === 'level' ? 1 : 2;
  const selectedLevel = useMemo(
    () => playerLevels.find((option) => option.id === level),
    [level],
  );

  const toggleGoal = (goal: PlayerGoal) => {
    setGoals((currentGoals) => {
      if (currentGoals.includes(goal)) {
        return currentGoals.length === 1 ? currentGoals : currentGoals.filter((item) => item !== goal);
      }
      return currentGoals.length >= 3 ? [...currentGoals.slice(1), goal] : [...currentGoals, goal];
    });
  };

  const complete = async () => {
    if (!level || isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      await saveProfile({ level, goals });
      router.replace('/(tabs)');
    } catch (error) {
      console.warn('Player profile could not be saved.', error);
      setSaveError('Your setup could not be saved on this iPhone. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (step === 'welcome') {
    return (
      <View style={styles.welcomeScreen}>
        <StatusBar style="light" />
        <ImageBackground source={homeHeroImage} style={styles.heroImage} resizeMode="cover">
          <View style={styles.heroShade} />
          <SafeAreaView style={styles.heroHeader} edges={['top']}>
            <BrandMark light />
            <View style={styles.localBadge}>
              <AppIcon color={colors.white} name="shield-checkmark-outline" size={15} />
              <Text maxFontSizeMultiplier={1.5} style={styles.localBadgeText}>PRIVATE BY DEFAULT</Text>
            </View>
          </SafeAreaView>
        </ImageBackground>

        <SafeAreaView style={styles.welcomePanel} edges={['bottom']}>
          <ScrollView
            contentContainerStyle={styles.welcomePanelContent}
            showsVerticalScrollIndicator={false}
          >
            <Text maxFontSizeMultiplier={1.5} style={styles.kicker}>YOUR GAME. ONE STEP BETTER.</Text>
            <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.welcomeTitle}>A coach in your court bag.</Text>
            <Text style={styles.welcomeBody}>
              Record five reps. Find one thing to improve. Come back sharper.
            </Text>
            <Button icon="arrow-forward" label="Build my plan" onPress={() => setStep('level')} />
            <Text style={styles.localNote}>Your practice videos stay on this iPhone during the prototype.</Text>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.formScreen} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.formHeader}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => {
            if (step === 'goals') {
              setStep('level');
            } else if (isEditing) {
              router.back();
            } else {
              setStep('welcome');
            }
          }}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <AppIcon color={colors.text} name="arrow-back" size={21} />
        </Pressable>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${stepNumber * 50}%` }]} />
        </View>
        <Text style={styles.stepCount}>{stepNumber}/2</Text>
      </View>

      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 'level' ? (
          <>
            <View style={styles.formCopy}>
              <Text maxFontSizeMultiplier={1.5} style={styles.kicker}>QUICK SETUP</Text>
              <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.formTitle}>Where is your game today?</Text>
              <Text style={styles.formBody}>Choose the level you usually play—not your best day.</Text>
            </View>
            <View style={styles.levelGrid}>
              {playerLevels.map((option) => {
                const isSelected = option.id === level;
                return (
                  <Pressable
                    key={option.id}
                    accessibilityLabel={`${option.label}. ${option.detail}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => setLevel(option.id)}
                    style={({ pressed }) => [
                      styles.levelCard,
                      useSingleColumnLevels && styles.levelCardSingleColumn,
                      isSelected && styles.optionSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={[styles.selectDot, isSelected && styles.selectDotSelected]}>
                      {isSelected ? <AppIcon color={colors.ink} name="checkmark" size={14} /> : null}
                    </View>
                    <Text style={styles.levelLabel}>{option.label}</Text>
                    <Text style={styles.levelDetail}>{option.detail}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : (
          <>
            <View style={styles.formCopy}>
              <Text maxFontSizeMultiplier={1.5} style={styles.kicker}>YOUR FOCUS</Text>
              <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.formTitle}>What would feel better?</Text>
              <Text style={styles.formBody}>Pick up to three. We will keep the plan focused.</Text>
            </View>
            <View style={styles.goalList}>
              {playerGoals.map((goal) => (
                <GoalOption
                  key={goal.id}
                  icon={goal.icon}
                  label={goal.label}
                  selected={goals.includes(goal.id)}
                  onPress={() => toggleGoal(goal.id)}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.formFooter}>
        {saveError ? (
          <View style={styles.saveError}>
            <AppIcon color={colors.danger} name="alert-circle-outline" size={18} />
            <Text style={styles.saveErrorText}>{saveError}</Text>
          </View>
        ) : null}
        {step === 'level' ? (
          <Button
            disabled={!level}
            icon="arrow-forward"
            label={selectedLevel ? `Continue as ${selectedLevel.label}` : 'Choose a level'}
            onPress={() => setStep('goals')}
          />
        ) : (
          <Button
            disabled={isSaving}
            icon="checkmark"
            label={isSaving ? 'Saving…' : isEditing ? 'Save my profile' : 'Start coaching'}
            onPress={() => void complete()}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function GoalOption({
  icon,
  label,
  onPress,
  selected,
}: {
  icon: AppIconName;
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.goalCard,
        selected && styles.optionSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.goalIcon, selected && styles.goalIconSelected]}>
        <AppIcon color={selected ? colors.ink : colors.primary} name={icon} size={22} />
      </View>
      <Text style={styles.goalLabel}>{label}</Text>
      <View style={[styles.selectDot, selected && styles.selectDotSelected]}>
        {selected ? <AppIcon color={colors.ink} name="checkmark" size={14} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  welcomeScreen: { flex: 1, backgroundColor: colors.background },
  heroImage: { flex: 1.15, justifyContent: 'flex-start' },
  heroShade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(5, 16, 10, 0.25)',
  },
  heroHeader: {
    paddingHorizontal: 22,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  localBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(7, 20, 13, 0.48)',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  localBadgeText: { color: colors.white, fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
  welcomePanel: {
    flex: 0.95,
    marginTop: -34,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.background,
  },
  welcomePanelContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 12,
    gap: 15,
    justifyContent: 'center',
  },
  kicker: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.45 },
  welcomeTitle: {
    color: colors.text,
    fontSize: 42,
    lineHeight: 45,
    fontWeight: '900',
    letterSpacing: -1.8,
    maxWidth: 350,
  },
  welcomeBody: { color: colors.muted, fontSize: 17, lineHeight: 24, maxWidth: 345, marginBottom: 4 },
  localNote: { color: colors.subtle, fontSize: 11, lineHeight: 16, textAlign: 'center', paddingHorizontal: 18 },
  formScreen: { flex: 1, backgroundColor: colors.background },
  formScroll: { flex: 1 },
  formHeader: {
    height: 66,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: colors.primaryBright },
  stepCount: { color: colors.muted, fontSize: 12, fontWeight: '800', minWidth: 24 },
  formContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, gap: 24 },
  formCopy: { gap: 9 },
  formTitle: {
    color: colors.text,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '900',
    letterSpacing: -1.3,
    maxWidth: 350,
  },
  formBody: { color: colors.muted, fontSize: 15, lineHeight: 22, maxWidth: 340 },
  levelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  levelCard: {
    width: '48%',
    minHeight: 142,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.surface,
    padding: 16,
    justifyContent: 'flex-end',
    gap: 5,
    ...shadows.card,
  },
  levelCardSingleColumn: { width: '100%', minHeight: 124 },
  optionSelected: { borderColor: colors.primaryBright, backgroundColor: colors.primaryMist },
  selectDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 13,
    right: 13,
  },
  selectDotSelected: { borderColor: colors.primaryBright, backgroundColor: colors.primaryBright },
  levelLabel: { color: colors.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
  levelDetail: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  goalList: { gap: 11 },
  goalCard: {
    minHeight: 72,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  goalIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalIconSelected: { backgroundColor: colors.primaryBright },
  goalLabel: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '800' },
  formFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: colors.background,
  },
  saveError: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: radius.sm, padding: 11, marginBottom: 9, backgroundColor: colors.dangerSoft },
  saveErrorText: { flex: 1, color: colors.danger, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  pressed: { opacity: 0.72 },
});
