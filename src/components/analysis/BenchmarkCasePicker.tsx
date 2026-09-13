import { ScrollView, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '@/src/components/ui/AppIcon';
import {
  getPoseBenchmarkCasesForPractice,
  PoseBenchmarkCaseId,
} from '@/src/domain/poseBenchmarkProtocol';
import { assessPoseBenchmarkCase, PoseBenchmarkRun } from '@/src/domain/poseBenchmark';
import { PracticeType } from '@/src/domain/practice';
import { colors, radius, shadows } from '@/src/theme';

const qualificationIssueLabels = {
  'physical-device-required': 'Run this case on a physical iPhone.',
  'visual-review-pending': 'Watch the full overlay and save a visual review.',
  'visual-issue-flagged': 'A visible tracking issue is still flagged.',
  'gate-mismatch': 'The quality gate did not match the controlled expectation.',
  'exact-source-required': 'S02 must reuse S01’s exact clip and Vision revision.',
};

type BenchmarkCasePickerProps = {
  disabled?: boolean;
  practiceType: PracticeType;
  runs: PoseBenchmarkRun[];
  selectedCaseId: PoseBenchmarkCaseId;
  onSelect: (caseId: PoseBenchmarkCaseId) => void;
};

export function BenchmarkCasePicker({
  disabled,
  onSelect,
  practiceType,
  runs,
  selectedCaseId,
}: BenchmarkCasePickerProps) {
  const cases = getPoseBenchmarkCasesForPractice(practiceType);
  const selectedCase = cases.find((item) => item.id === selectedCaseId) ?? cases[0];
  const selectedAssessment = assessPoseBenchmarkCase(selectedCase.id, runs);

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <View>
          <Text style={styles.eyebrow}>CONTROLLED CONDITION</Text>
          <Text style={styles.title}>Choose the test case</Text>
        </View>
        <Text style={styles.count}>{cases.length} cases</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.caseRow}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {cases.map((item) => {
          const selected = item.id === selectedCaseId;
          const assessment = assessPoseBenchmarkCase(item.id, runs);
          const statusLabel = assessment.status === 'qualified'
            ? 'qualified'
            : assessment.status === 'needs-review'
              ? 'needs review'
              : 'not started';
          return (
            <Pressable
              key={item.id}
              accessibilityLabel={`${item.id}. ${item.title}. ${statusLabel}`}
              accessibilityRole="button"
              accessibilityState={{ disabled, selected }}
              disabled={disabled}
              onPress={() => onSelect(item.id)}
              style={({ pressed }) => [
                styles.casePill,
                selected && styles.casePillSelected,
                pressed && styles.pressed,
              ]}
            >
              {assessment.status === 'qualified' ? (
                <AppIcon color={selected ? colors.white : colors.primary} name="checkmark-circle" size={15} />
              ) : assessment.status === 'needs-review' ? (
                <AppIcon color={selected ? colors.white : colors.warning} name="alert-circle" size={15} />
              ) : null}
              <Text style={[styles.caseId, selected && styles.caseIdSelected]}>{item.id}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.selectedCard}>
        <View style={styles.caseBadge}>
          <Text style={styles.caseBadgeText}>{selectedCase.id}</Text>
        </View>
        <View style={styles.selectedCopy}>
          <Text style={styles.selectedTitle}>{selectedCase.title}</Text>
          <Text style={styles.selectedDetail}>{selectedCase.detail}</Text>
        </View>
        <View style={styles.expectation}>
          <Text style={styles.expectationText}>
            {selectedCase.expectedGate === 'usable'
              ? 'EXPECT USABLE'
              : selectedCase.expectedGate === 'retake'
                ? 'EXPECT RETAKE'
                : 'OBSERVE'}
          </Text>
        </View>
      </View>

      {selectedAssessment.status !== 'pending' ? (
        <View
          accessibilityLiveRegion="polite"
          style={selectedAssessment.status === 'qualified' ? styles.qualifiedNotice : styles.reviewNotice}
        >
          <AppIcon
            color={selectedAssessment.status === 'qualified' ? colors.primary : colors.warning}
            name={selectedAssessment.status === 'qualified' ? 'checkmark-circle' : 'alert-circle'}
            size={17}
          />
          <Text style={selectedAssessment.status === 'qualified' ? styles.qualifiedText : styles.reviewText}>
            {selectedAssessment.status === 'qualified'
              ? 'Qualified with clean physical-iPhone evidence.'
              : selectedAssessment.issues.map((issue) => qualificationIssueLabels[issue]).join(' ')}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 11 },
  heading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 2 },
  eyebrow: { color: colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  title: { color: colors.text, fontSize: 21, fontWeight: '900', letterSpacing: -0.4, marginTop: 3 },
  count: { color: colors.subtle, fontSize: 11, fontWeight: '800' },
  caseRow: { gap: 7, paddingHorizontal: 1, paddingBottom: 3 },
  casePill: {
    minWidth: 64,
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  casePillSelected: { backgroundColor: colors.primary, borderColor: colors.primary, ...shadows.card },
  caseId: { color: colors.text, fontSize: 12, fontWeight: '900', letterSpacing: 0.4 },
  caseIdSelected: { color: colors.white },
  selectedCard: {
    minHeight: 84,
    borderRadius: radius.md,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: colors.primaryMist,
  },
  caseBadge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  caseBadgeText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  selectedCopy: { flex: 1, gap: 3 },
  selectedTitle: { color: colors.text, fontSize: 14, lineHeight: 18, fontWeight: '900' },
  selectedDetail: { color: colors.muted, fontSize: 11, lineHeight: 15 },
  expectation: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: colors.surface },
  expectationText: { color: colors.primary, fontSize: 7, fontWeight: '900', letterSpacing: 0.45 },
  qualifiedNotice: { minHeight: 44, borderRadius: radius.sm, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primaryMist },
  qualifiedText: { flex: 1, color: colors.primary, fontSize: 11, lineHeight: 16, fontWeight: '800' },
  reviewNotice: { minHeight: 44, borderRadius: radius.sm, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.warningSoft },
  reviewText: { flex: 1, color: colors.warning, fontSize: 11, lineHeight: 16, fontWeight: '800' },
  pressed: { opacity: 0.68 },
});
