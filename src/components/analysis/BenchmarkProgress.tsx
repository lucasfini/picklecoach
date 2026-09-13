import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '@/src/components/ui/AppIcon';
import { getPoseBenchmarkCoverage, PoseBenchmarkRun } from '@/src/domain/poseBenchmark';
import { poseBenchmarkCases } from '@/src/domain/poseBenchmarkProtocol';
import { colors, radius } from '@/src/theme';

export function BenchmarkProgress({ onShare, runs }: { onShare: () => void; runs: PoseBenchmarkRun[] }) {
  const coverage = getPoseBenchmarkCoverage(runs);
  const progress = coverage.qualifiedCaseCount / poseBenchmarkCases.length;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.eyebrow}>BENCHMARK COVERAGE</Text>
          <Text style={styles.title}>{coverage.qualifiedCaseCount}<Text style={styles.total}> / {poseBenchmarkCases.length}</Text> cases qualified</Text>
        </View>
        <Pressable
          accessibilityLabel="Share privacy-safe benchmark report"
          accessibilityRole="button"
          disabled={runs.length === 0}
          onPress={onShare}
          style={({ pressed }) => [styles.shareButton, runs.length === 0 && styles.disabled, pressed && styles.pressed]}
        >
          <AppIcon color={colors.primary} name="share-outline" size={19} />
        </Pressable>
      </View>
      <View
        accessible
        accessibilityLabel={`${coverage.qualifiedCaseCount} of ${poseBenchmarkCases.length} benchmark cases qualified`}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: poseBenchmarkCases.length, now: coverage.qualifiedCaseCount }}
        style={styles.track}
      >
        <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>
      <Text style={styles.note}>
        {coverage.physicalRunCount} physical runs · {coverage.visuallyReviewedPhysicalRunCount} visually checked · {coverage.needsReviewCaseCount} need review
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: 17, gap: 12, backgroundColor: colors.ink },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  eyebrow: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 0.9 },
  title: { color: colors.white, fontSize: 20, fontWeight: '900', letterSpacing: -0.4, marginTop: 4 },
  total: { color: '#AAB8B1', fontSize: 14 },
  shareButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  track: { height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: '#29352F' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: colors.primaryBright },
  note: { color: '#AAB8B1', fontSize: 10, fontWeight: '700' },
  disabled: { opacity: 0.35 },
  pressed: { opacity: 0.68 },
});
