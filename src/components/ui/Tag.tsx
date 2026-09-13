import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/src/theme';

type TagTone = 'green' | 'lime' | 'coral' | 'neutral' | 'dark';

const backgrounds = {
  green: colors.primarySoft,
  lime: colors.accentSoft,
  coral: colors.coralSoft,
  neutral: colors.surfaceMuted,
  dark: colors.ink,
};

const foregrounds = {
  green: colors.primary,
  lime: colors.text,
  coral: colors.danger,
  neutral: colors.muted,
  dark: colors.white,
};

export function Tag({ children, tone = 'green' }: PropsWithChildren<{ tone?: TagTone }>) {
  return (
    <View style={[styles.container, { backgroundColor: backgrounds[tone] }]}>
      <Text maxFontSizeMultiplier={1.5} style={[styles.label, { color: foregrounds[tone] }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  label: { fontSize: 11, lineHeight: 13, fontWeight: '900', letterSpacing: 0.55 },
});
