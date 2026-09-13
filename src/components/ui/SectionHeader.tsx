import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/src/theme';

type SectionHeaderProps = {
  action?: string;
  eyebrow?: string;
  title: string;
};

export function SectionHeader({ action, eyebrow, title }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        {eyebrow ? <Text maxFontSizeMultiplier={1.5} style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.title}>{title}</Text>
      </View>
      {action ? <Text maxFontSizeMultiplier={1.6} style={styles.action}>{action}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  copy: { flex: 1, gap: 3 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: colors.text, fontSize: 24, lineHeight: 29, fontWeight: '900', letterSpacing: -0.7 },
  action: { color: colors.primary, fontSize: 13, fontWeight: '800', paddingBottom: 3 },
});
