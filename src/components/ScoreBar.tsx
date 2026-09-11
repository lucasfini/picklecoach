import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/src/theme';

export function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.score}>{score}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(4, Math.min(100, score))}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 7 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: colors.text, fontSize: 15, fontWeight: '600' },
  score: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  track: { height: 8, borderRadius: 99, backgroundColor: colors.primarySoft, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 99, backgroundColor: colors.primary },
});
