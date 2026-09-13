import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/src/components/Card';
import { AppIcon, AppIconName } from '@/src/components/ui/AppIcon';
import { Button } from '@/src/components/ui/Button';
import { Tag } from '@/src/components/ui/Tag';
import { usePlayerProfile } from '@/src/providers/PlayerProfileProvider';
import { usePracticeActivity } from '@/src/providers/PracticeActivityProvider';
import {
  clearPoseBenchmarkRuns,
  readPoseBenchmarkRuns,
} from '@/src/services/poseBenchmarkRepository';
import { purgeAbandonedLocalJsonWrites } from '@/src/services/localJsonStore';
import { purgeLocalRecordings } from '@/src/services/localRecordingFiles';
import { colors, radius } from '@/src/theme';

type PrivacyAction = 'clips' | 'history' | 'reset' | null;

const lifecycleSteps: Array<{ icon: AppIconName; label: string; detail: string }> = [
  {
    icon: 'videocam-outline',
    label: 'Record',
    detail: 'A silent temporary clip is created inside PickleCoach’s private app cache.',
  },
  {
    icon: 'body-outline',
    label: 'Review',
    detail: 'Pose tracking runs on this iPhone. Nothing is uploaded.',
  },
  {
    icon: 'trash-outline',
    label: 'Leave',
    detail: 'The raw clip is deleted. Only compact practice metadata remains.',
  },
];

export default function PrivacyScreen() {
  const router = useRouter();
  const { profile, resetProfile } = usePlayerProfile();
  const { activities, clearActivities } = usePracticeActivity();
  const [benchmarkCount, setBenchmarkCount] = useState(0);
  const [activeAction, setActiveAction] = useState<PrivacyAction>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    void readPoseBenchmarkRuns().then((runs) => {
      if (isActive) setBenchmarkCount(runs.length);
    });
    return () => {
      isActive = false;
    };
  }, []);

  const clearTemporaryClips = async () => {
    setActiveAction('clips');
    setStatus(null);
    try {
      const deletedCount = await purgeLocalRecordings();
      setStatus(
        deletedCount === 0
          ? 'No abandoned temporary clips were found.'
          : `${deletedCount} temporary ${deletedCount === 1 ? 'clip was' : 'clips were'} deleted.`,
      );
    } catch {
      setStatus('Temporary clips could not be cleared. Please try again.');
    } finally {
      setActiveAction(null);
    }
  };

  const confirmClearHistory = () => {
    Alert.alert(
      'Clear practice history?',
      'This removes session dates, skills, and durations from this iPhone. Your player plan stays.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear history',
          style: 'destructive',
          onPress: () => {
            setActiveAction('history');
            setStatus(null);
            void clearActivities()
              .then(() => setStatus('Practice history cleared.'))
              .catch(() => setStatus('Practice history could not be cleared. Please try again.'))
              .finally(() => setActiveAction(null));
          },
        },
      ],
    );
  };

  const confirmReset = () => {
    Alert.alert(
      'Reset PickleCoach on this iPhone?',
      'This removes your player plan, practice history, development benchmark summaries, and temporary clips. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset everything',
          style: 'destructive',
          onPress: () => {
            setActiveAction('reset');
            setStatus(null);
            void Promise.allSettled([
              clearActivities(),
              clearPoseBenchmarkRuns(),
              purgeAbandonedLocalJsonWrites(),
              purgeLocalRecordings(),
            ]).then(async (results) => {
              if (results[1]?.status === 'fulfilled') {
                setBenchmarkCount(0);
              }

              const failures = results.filter((result) => result.status === 'rejected');
              if (failures.length > 0) {
                console.warn('Some local app data could not be reset.', failures);
                setStatus('Some local data was cleared, but reset did not finish. Please try again.');
                setActiveAction(null);
                return;
              }

              try {
                // Reset the routing profile last. If an earlier category fails,
                // the player stays on this recovery screen and can retry.
                await resetProfile();
                router.replace('/onboarding');
              } catch (error) {
                console.warn('The local player profile could not be reset.', error);
                setStatus('Practice data was cleared, but your player plan remains. Please try again.');
                setActiveAction(null);
              }
            });
          },
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Stack.Screen options={{ title: 'Privacy & data' }} />

      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <AppIcon color={colors.primary} name="shield-checkmark" size={30} />
        </View>
        <Tag tone="green">PRIVATE BY DEFAULT</Tag>
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.title}>
          Your practice stays yours.
        </Text>
        <Text style={styles.subtitle}>
          The prototype has no account, cloud storage, advertising SDK, or video upload.
        </Text>
      </View>

      <Card style={styles.lifecycleCard}>
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.sectionTitle}>
          What happens to a clip
        </Text>
        <View style={styles.lifecycleList}>
          {lifecycleSteps.map((step, index) => (
            <View key={step.label} style={styles.lifecycleRow}>
              <View style={styles.stepIcon}>
                <AppIcon color={colors.primary} name={step.icon} size={21} />
              </View>
              <View style={styles.stepCopy}>
                <Text style={styles.stepLabel}>{index + 1}. {step.label}</Text>
                <Text style={styles.stepDetail}>{step.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.section}>
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.sectionTitle}>
          Stored on this iPhone
        </Text>
        <Card style={styles.inventoryCard}>
          <InventoryRow
            detail={profile ? `${profile.goals.length} goals selected` : 'Not set'}
            icon="person-outline"
            label="Player plan"
          />
          <View style={styles.divider} />
          <InventoryRow
            detail={`${activities.length} ${activities.length === 1 ? 'session' : 'sessions'} · metadata only`}
            icon="time-outline"
            label="Practice history"
          />
          {__DEV__ ? (
            <>
              <View style={styles.divider} />
              <InventoryRow
                detail={`${benchmarkCount} aggregate ${benchmarkCount === 1 ? 'summary' : 'summaries'}`}
                icon="flask-outline"
                label="Pose Lab"
              />
            </>
          ) : null}
        </Card>
      </View>

      <View style={styles.section}>
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.sectionTitle}>
          Your controls
        </Text>
        <Button
          disabled={activeAction !== null}
          icon="trash-outline"
          label={activeAction === 'clips' ? 'Clearing clips…' : 'Clear temporary clips'}
          onPress={() => void clearTemporaryClips()}
          variant="secondary"
        />
        <Button
          disabled={activeAction !== null || activities.length === 0}
          label={activeAction === 'history' ? 'Clearing history…' : 'Clear practice history'}
          onPress={confirmClearHistory}
          variant="secondary"
        />
        <Pressable
          accessibilityRole="button"
          disabled={activeAction !== null}
          onPress={confirmReset}
          style={({ pressed }) => [
            styles.resetButton,
            activeAction !== null && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <AppIcon color={colors.danger} name="trash-outline" size={18} />
          <Text maxFontSizeMultiplier={1.8} style={styles.resetText}>
            {activeAction === 'reset' ? 'Resetting…' : 'Reset all local data'}
          </Text>
        </Pressable>
        {status ? (
          <View accessibilityLiveRegion="polite" style={styles.statusCard}>
            <AppIcon color={colors.primary} name="information-circle-outline" size={18} />
            <Text style={styles.statusText}>{status}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.footer}>
        Future cloud features will require explicit consent and separate retention controls before launch.
      </Text>
    </ScrollView>
  );
}

function InventoryRow({ detail, icon, label }: { detail: string; icon: AppIconName; label: string }) {
  return (
    <View accessible accessibilityLabel={`${label}: ${detail}`} style={styles.inventoryRow}>
      <View style={styles.inventoryIcon}>
        <AppIcon color={colors.primary} name={icon} size={20} />
      </View>
      <View style={styles.inventoryCopy}>
        <Text style={styles.inventoryLabel}>{label}</Text>
        <Text style={styles.inventoryDetail}>{detail}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48, gap: 24, backgroundColor: colors.background },
  hero: { gap: 10, paddingTop: 8 },
  heroIcon: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, marginBottom: 4 },
  title: { color: colors.text, fontSize: 36, lineHeight: 40, fontWeight: '900', letterSpacing: -1.3, maxWidth: 350 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, maxWidth: 360 },
  lifecycleCard: { gap: 18, backgroundColor: colors.primaryMist },
  sectionTitle: { color: colors.text, fontSize: 22, lineHeight: 27, fontWeight: '900', letterSpacing: -0.5 },
  lifecycleList: { gap: 17 },
  lifecycleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 13 },
  stepIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  stepCopy: { flex: 1, gap: 3 },
  stepLabel: { color: colors.text, fontSize: 15, fontWeight: '900' },
  stepDetail: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  section: { gap: 12 },
  inventoryCard: { paddingVertical: 5 },
  inventoryRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12 },
  inventoryIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  inventoryCopy: { flex: 1, gap: 3, paddingVertical: 10 },
  inventoryLabel: { color: colors.text, fontSize: 15, fontWeight: '900' },
  inventoryDetail: { color: colors.muted, fontSize: 12, lineHeight: 17, fontWeight: '600' },
  divider: { height: 1, marginLeft: 52, backgroundColor: colors.border },
  resetButton: { minHeight: 54, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.coralSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20, backgroundColor: colors.surface },
  resetText: { flexShrink: 1, color: colors.danger, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  statusCard: { borderRadius: radius.sm, flexDirection: 'row', alignItems: 'center', gap: 9, padding: 13, backgroundColor: colors.primarySoft },
  statusText: { flex: 1, color: colors.text, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  footer: { color: colors.subtle, fontSize: 11, lineHeight: 17, textAlign: 'center', paddingHorizontal: 12 },
  disabled: { opacity: 0.42 },
  pressed: { opacity: 0.72 },
});
