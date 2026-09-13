import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '@/src/components/ui/AppIcon';
import { Button } from '@/src/components/ui/Button';
import {
  PoseBenchmarkRun,
  PoseBenchmarkVisualIssue,
} from '@/src/domain/poseBenchmark';
import { colors, radius } from '@/src/theme';

const issueOptions: { id: PoseBenchmarkVisualIssue; label: string }[] = [
  { id: 'limb-swap', label: 'Limb swap' },
  { id: 'skeleton-jump', label: 'Skeleton jump' },
  { id: 'missing-critical-joints', label: 'Missing joints' },
  { id: 'wrong-person', label: 'Wrong person' },
  { id: 'timing-drift', label: 'Timing drift' },
  { id: 'other', label: 'Other issue' },
];

type BenchmarkVisualReviewProps = {
  isSaving: boolean;
  run: PoseBenchmarkRun;
  onSave: (review: 'clean' | 'needs-review', issues: PoseBenchmarkVisualIssue[]) => Promise<void>;
};

export function BenchmarkVisualReview({ isSaving, onSave, run }: BenchmarkVisualReviewProps) {
  const [isFlagging, setIsFlagging] = useState(run.visualReview === 'needs-review');
  const [issues, setIssues] = useState<PoseBenchmarkVisualIssue[]>(run.visualIssues ?? []);

  useEffect(() => {
    setIsFlagging(run.visualReview === 'needs-review');
    setIssues(run.visualIssues ?? []);
  }, [run.id, run.visualIssues, run.visualReview]);

  const toggleIssue = (issue: PoseBenchmarkVisualIssue) => {
    setIssues((current) => current.includes(issue)
      ? current.filter((item) => item !== issue)
      : [...current, issue]);
  };

  if (run.visualReview === 'clean' && !isFlagging) {
    return (
      <View style={styles.savedCard}>
        <View style={styles.savedIcon}>
          <AppIcon color={colors.primary} name="checkmark" size={21} />
        </View>
        <View style={styles.savedCopy}>
          <Text style={styles.savedTitle}>Visual review saved as clean</Text>
          <Text style={styles.savedBody}>The overlay stayed with the player through the useful motion.</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => setIsFlagging(true)}>
          <Text style={styles.changeText}>Change</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <View style={styles.headingIcon}>
          <AppIcon color={colors.primary} name="eye-outline" size={22} />
        </View>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>HUMAN CHECK</Text>
          <Text style={styles.title}>Did the skeleton stay honest?</Text>
          <Text style={styles.body}>Watch the full clip once. Aggregate coverage alone cannot catch limb swaps or jumps.</Text>
        </View>
      </View>

      {isFlagging ? (
        <>
          <Text style={styles.issuePrompt}>Select every visible problem</Text>
          <View style={styles.issueGrid}>
            {issueOptions.map((option) => {
              const selected = issues.includes(option.id);
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  disabled={isSaving}
                  onPress={() => toggleIssue(option.id)}
                  style={({ pressed }) => [
                    styles.issuePill,
                    selected && styles.issuePillSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  {selected ? <AppIcon color={colors.ink} name="checkmark" size={14} /> : null}
                  <Text style={[styles.issueLabel, selected && styles.issueLabelSelected]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Button
            disabled={isSaving || issues.length === 0}
            icon="flag-outline"
            label={isSaving ? 'Saving…' : 'Save flagged review'}
            onPress={() => void onSave('needs-review', issues)}
            variant="secondary"
          />
          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            onPress={() => {
              setIssues([]);
              setIsFlagging(false);
            }}
          >
            <Text style={styles.cancelText}>Cancel flagging</Text>
          </Pressable>
        </>
      ) : (
        <View style={styles.actions}>
          <View style={styles.action}>
            <Button
              disabled={isSaving}
              icon="checkmark"
              label={isSaving ? 'Saving…' : 'Overlay looked clean'}
              onPress={() => void onSave('clean', [])}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            onPress={() => setIsFlagging(true)}
            style={({ pressed }) => [styles.flagButton, pressed && styles.pressed]}
          >
            <AppIcon color={colors.warning} name="flag-outline" size={18} />
            <Text style={styles.flagText}>Flag an issue</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: 18, gap: 15, backgroundColor: colors.surface },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headingIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  headingCopy: { flex: 1, gap: 4 },
  eyebrow: { color: colors.primary, fontSize: 8, fontWeight: '900', letterSpacing: 0.9 },
  title: { color: colors.text, fontSize: 18, lineHeight: 22, fontWeight: '900' },
  body: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  actions: { gap: 9 },
  action: { width: '100%' },
  flagButton: { minHeight: 48, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: colors.warningSoft },
  flagText: { color: colors.warning, fontSize: 13, fontWeight: '900' },
  issuePrompt: { color: colors.text, fontSize: 12, fontWeight: '900' },
  issueGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  issuePill: { minHeight: 40, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.background },
  issuePillSelected: { borderColor: colors.warning, backgroundColor: colors.warning },
  issueLabel: { color: colors.text, fontSize: 11, fontWeight: '800' },
  issueLabelSelected: { color: colors.ink },
  cancelText: { color: colors.subtle, fontSize: 12, fontWeight: '800', textAlign: 'center', paddingVertical: 5 },
  savedCard: { borderRadius: radius.md, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: colors.primaryMist },
  savedIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  savedCopy: { flex: 1, gap: 3 },
  savedTitle: { color: colors.text, fontSize: 13, fontWeight: '900' },
  savedBody: { color: colors.muted, fontSize: 10, lineHeight: 14 },
  changeText: { color: colors.primary, fontSize: 11, fontWeight: '900', padding: 6 },
  pressed: { opacity: 0.68 },
});
