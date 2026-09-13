import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/src/components/Card';
import { AppIcon } from '@/src/components/ui/AppIcon';
import { Tag } from '@/src/components/ui/Tag';
import {
  getLatestPoseBenchmarkRunForCase,
  PoseBenchmarkRun,
} from '@/src/domain/poseBenchmark';
import { PoseBenchmarkCaseId } from '@/src/domain/poseBenchmarkProtocol';
import { formatPosePercentage } from '@/src/domain/poseTracking';
import { colors, radius } from '@/src/theme';

type BenchmarkCaseEvidenceProps = {
  caseId: PoseBenchmarkCaseId;
  runs: PoseBenchmarkRun[];
};

function formatRuntime(milliseconds: number) {
  return milliseconds < 1000
    ? `${milliseconds} ms`
    : `${(milliseconds / 1000).toFixed(1)} sec`;
}

function reviewLabel(run: PoseBenchmarkRun) {
  if (run.visualReview === 'clean') return 'CLEAN';
  if (run.visualReview === 'needs-review') return 'FLAGGED';
  return 'REVIEW PENDING';
}

export function BenchmarkCaseEvidence({ caseId, runs }: BenchmarkCaseEvidenceProps) {
  const latestRun = getLatestPoseBenchmarkRunForCase(caseId, runs);
  if (!latestRun) return null;

  const caseRunCount = runs.filter((run) => run.benchmarkCaseId === caseId).length;
  const reviewIsPending = latestRun.visualReview !== 'clean' && latestRun.visualReview !== 'needs-review';

  return (
    <Card style={styles.card}>
      <View style={styles.heading}>
        <View style={styles.icon}>
          <AppIcon color={colors.primary} name="analytics-outline" size={22} />
        </View>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>LATEST SAVED EVIDENCE</Text>
          <Text style={styles.title}>{caseId} tracking summary</Text>
          <Text style={styles.meta}>{caseRunCount} saved {caseRunCount === 1 ? 'run' : 'runs'} on this iPhone</Text>
        </View>
        <Tag tone={latestRun.status === 'usable' ? 'green' : 'coral'}>
          {latestRun.status.toUpperCase()}
        </Tag>
      </View>

      <View style={styles.metrics}>
        <EvidenceMetric label="BODY" value={formatPosePercentage(latestRun.poseCoverage)} />
        <EvidenceMetric label="JOINTS" value={formatPosePercentage(latestRun.keyJointCoverage)} />
        <EvidenceMetric label="CONFIDENCE" value={formatPosePercentage(latestRun.averageConfidence)} />
        <EvidenceMetric label="RUNTIME" value={formatRuntime(latestRun.runtimeMilliseconds)} />
      </View>

      <View style={styles.reviewRow}>
        <AppIcon
          color={latestRun.visualReview === 'clean' ? colors.primary : colors.warning}
          name={latestRun.visualReview === 'clean' ? 'checkmark-circle' : 'eye-outline'}
          size={16}
        />
        <Text style={styles.reviewText}>{reviewLabel(latestRun)}</Text>
      </View>

      <View style={styles.privacyNote}>
        <AppIcon color={colors.subtle} name="shield-checkmark-outline" size={15} />
        <Text style={styles.privacyText}>
          {reviewIsPending
            ? `The temporary recording is gone, so this run cannot be reviewed now. Record ${caseId} again to qualify it.`
            : 'The recording is intentionally removed after you leave this case. These aggregate stats stay local.'}
        </Text>
      </View>
    </Card>
  );
}

function EvidenceMetric({ label, value }: { label: string; value: string }) {
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 13, backgroundColor: colors.surface },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  headingCopy: { flex: 1, gap: 2 },
  eyebrow: { color: colors.primary, fontSize: 8, fontWeight: '900', letterSpacing: 0.85 },
  title: { color: colors.text, fontSize: 17, lineHeight: 21, fontWeight: '900' },
  meta: { color: colors.subtle, fontSize: 10, fontWeight: '700' },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  metric: { width: '48%', minHeight: 66, borderRadius: radius.sm, padding: 10, justifyContent: 'flex-end', gap: 2, backgroundColor: colors.primaryMist },
  metricValue: { color: colors.primary, fontSize: 17, fontWeight: '900', letterSpacing: -0.35 },
  metricLabel: { color: colors.muted, fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reviewText: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
  privacyNote: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 11, flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  privacyText: { flex: 1, color: colors.subtle, fontSize: 10, lineHeight: 15, fontWeight: '700' },
});
