import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark } from '@/src/components/BrandMark';
import { Card } from '@/src/components/Card';
import { AppIcon, AppIconName } from '@/src/components/ui/AppIcon';
import { Tag } from '@/src/components/ui/Tag';
import { playerGoals, playerLevels } from '@/src/domain/playerProfile';
import { usePlayerProfile } from '@/src/providers/PlayerProfileProvider';
import { usePracticeActivity } from '@/src/providers/PracticeActivityProvider';
import { colors, radius, shadows } from '@/src/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile } = usePlayerProfile();
  const { activities } = usePracticeActivity();
  const level = playerLevels.find((option) => option.id === profile?.level);
  const goals = playerGoals.filter((goal) => profile?.goals.includes(goal.id));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <BrandMark compact />
          <Tag tone="green">ON THIS IPHONE</Tag>
        </View>

        <View style={styles.identity}>
          <View style={styles.avatar}>
            <AppIcon color={colors.primary} name="person" size={31} />
          </View>
          <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.title}>Your player profile</Text>
          <Text style={styles.subtitle}>A little context makes future coaching more useful.</Text>
        </View>

        <Card style={styles.levelCard}>
          <View style={styles.cardTopRow}>
            <View style={styles.levelCopy}>
              <Text style={styles.eyebrow}>PLAYING LEVEL</Text>
              <Text style={styles.levelValue}>{level?.label ?? 'Not set'}</Text>
              <Text style={styles.levelDetail}>{level?.detail ?? 'Choose your starting point'}</Text>
            </View>
            <Pressable
              accessibilityLabel="Edit player level and goals"
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/onboarding', params: { mode: 'edit' } })}
              style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
            >
              <AppIcon color={colors.primary} name="pencil" size={18} />
            </Pressable>
          </View>
        </Card>

        <View style={styles.section}>
          <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.sectionTitle}>What you are building</Text>
          <View style={styles.goalGrid}>
            {goals.map((goal) => (
              <View key={goal.id} style={styles.goalPill}>
                <AppIcon color={colors.primary} name={goal.icon} size={18} />
                <Text style={styles.goalLabel}>{goal.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.sectionTitle}>App & privacy</Text>
          <Card style={styles.settingsCard}>
            <SettingsRow icon="body-outline" label="Analysis status" value="Demo mode" />
            <View style={styles.divider} />
            <SettingsRow
              icon="shield-checkmark-outline"
              label="Video handling"
              onPress={() => router.push('/privacy')}
              value="Temporary"
            />
            <View style={styles.divider} />
            <SettingsRow icon="videocam-outline" label="Practice history" value={`${activities.length} ${activities.length === 1 ? 'session' : 'sessions'}`} />
          </Card>
        </View>

        <View style={styles.truthCard}>
          <View style={styles.truthIcon}>
            <AppIcon color={colors.text} name="sparkles" size={23} />
          </View>
          <View style={styles.truthCopy}>
            <Text style={styles.truthTitle}>Honest coaching, by design.</Text>
            <Text style={styles.truthBody}>Scores only become real when they come from validated video measurements.</Text>
          </View>
        </View>

        {__DEV__ ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/dev/pose-lab')}
            style={({ pressed }) => [styles.labCard, pressed && styles.pressed]}
          >
            <View style={styles.labIcon}>
              <AppIcon color={colors.warning} name="flask-outline" size={22} />
            </View>
            <View style={styles.labCopy}>
              <Text style={styles.labEyebrow}>DEVELOPMENT ONLY</Text>
              <Text style={styles.labTitle}>Open pose benchmark lab</Text>
              <Text style={styles.labBody}>Record or import one controlled clip and inspect real landmark tracking.</Text>
            </View>
            <AppIcon color={colors.subtle} name="chevron-forward" size={19} />
          </Pressable>
        ) : null}

        <Text style={styles.version}>PickleCoach prototype · Local-first build</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsRow({
  icon,
  label,
  onPress,
  value,
}: {
  icon: AppIconName;
  label: string;
  onPress?: () => void;
  value: string;
}) {
  const content = (
    <>
      <View style={styles.settingsIcon}>
        <AppIcon color={colors.primary} name={icon} size={20} />
      </View>
      <View style={styles.settingsCopy}>
        <Text style={styles.settingsLabel}>{label}</Text>
        <Text style={styles.settingsValue}>{value}</Text>
      </View>
      {onPress ? <AppIcon color={colors.subtle} name="chevron-forward" size={18} /> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityHint="Opens privacy details and local data controls"
        accessibilityLabel={`${label}: ${value}`}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.settingsRow, pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.settingsRow}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, paddingBottom: 120, gap: 24 },
  header: { paddingTop: 7, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  identity: { alignItems: 'center', gap: 8, paddingTop: 8 },
  avatar: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, marginBottom: 3 },
  title: { color: colors.text, fontSize: 31, lineHeight: 35, fontWeight: '900', letterSpacing: -1.1, textAlign: 'center' },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center', maxWidth: 330 },
  levelCard: { backgroundColor: colors.primaryMist },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  levelCopy: { flex: 1 },
  eyebrow: { color: colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginBottom: 6 },
  levelValue: { color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.7 },
  levelDetail: { color: colors.muted, fontSize: 12, marginTop: 2 },
  editButton: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, ...shadows.card },
  section: { gap: 12 },
  sectionTitle: { color: colors.text, fontSize: 21, fontWeight: '900', letterSpacing: -0.5 },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  goalPill: { minHeight: 44, borderRadius: radius.pill, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.surface, ...shadows.card },
  goalLabel: { color: colors.text, fontSize: 13, fontWeight: '800' },
  settingsCard: { paddingVertical: 5 },
  settingsRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingsIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  settingsCopy: { flex: 1, gap: 2, paddingVertical: 10 },
  settingsLabel: { color: colors.text, fontSize: 15, fontWeight: '800' },
  settingsValue: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  divider: { height: 1, marginLeft: 50, backgroundColor: colors.border },
  truthCard: { borderRadius: radius.lg, padding: 18, flexDirection: 'row', gap: 13, backgroundColor: colors.accent },
  truthIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.52)' },
  truthCopy: { flex: 1, gap: 5 },
  truthTitle: { color: colors.text, fontSize: 17, lineHeight: 21, fontWeight: '900' },
  truthBody: { color: colors.text, opacity: 0.72, fontSize: 12, lineHeight: 17 },
  labCard: { minHeight: 92, borderRadius: radius.md, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.warningSoft },
  labIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  labCopy: { flex: 1, gap: 3 },
  labEyebrow: { color: colors.warning, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  labTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  labBody: { color: colors.muted, fontSize: 11, lineHeight: 15 },
  version: { color: colors.subtle, fontSize: 11, textAlign: 'center' },
  pressed: { opacity: 0.68 },
});
