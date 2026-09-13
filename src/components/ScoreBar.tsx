import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/src/theme';

export function ScoreBar({ label, score }: { label: string; score: number }) {
  const boundedScore = Math.max(0, Math.min(100, score));
  return (
    <View
      accessible
      accessibilityLabel={`${label}, sample score ${boundedScore} out of 100`}
      accessibilityRole="progressbar"
      accessibilityValue={{ max: 100, min: 0, now: boundedScore }}
      style={styles.wrap}
    >
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.score}>{score}<Text style={styles.outOf}>/100</Text></Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(4, boundedScore)}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: colors.text, fontSize: 14, fontWeight: '800' },
  score: { color: colors.primary, fontSize: 13, fontWeight: '900', fontVariant: ['tabular-nums'] },
  outOf: { color: colors.subtle, fontSize: 9, fontWeight: '700' },
  track: { height: 7, borderRadius: 99, backgroundColor: colors.primarySoft, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 99, backgroundColor: colors.primaryBright },
});
