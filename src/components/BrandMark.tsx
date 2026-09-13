import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/src/theme';

type BrandMarkProps = {
  light?: boolean;
  compact?: boolean;
};

export function BrandMark({ compact = false, light = false }: BrandMarkProps) {
  return (
    <View style={styles.row}>
      <View style={[styles.ball, compact && styles.ballCompact]}>
        <View style={[styles.hole, styles.holeTop]} />
        <View style={[styles.hole, styles.holeLeft]} />
        <View style={[styles.hole, styles.holeRight]} />
      </View>
      <Text
        allowFontScaling={false}
        style={[styles.wordmark, compact && styles.wordmarkCompact, light && styles.wordmarkLight]}
      >
        PickleCoach
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  ball: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accent,
    position: 'relative',
  },
  ballCompact: { width: 25, height: 25, borderRadius: 13 },
  hole: { position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary },
  holeTop: { top: 6, left: 13 },
  holeLeft: { bottom: 7, left: 7 },
  holeRight: { bottom: 7, right: 7 },
  wordmark: { color: colors.text, fontSize: 21, fontWeight: '900', letterSpacing: -0.8 },
  wordmarkCompact: { fontSize: 18 },
  wordmarkLight: { color: colors.white },
});
