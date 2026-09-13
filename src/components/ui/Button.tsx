import { forwardRef } from 'react';
import { Pressable, PressableProps, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows } from '@/src/theme';
import { AppIcon, AppIconName } from '@/src/components/ui/AppIcon';

type ButtonVariant = 'primary' | 'secondary' | 'dark' | 'ghost';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  icon?: AppIconName;
  label: string;
  variant?: ButtonVariant;
};

const iconColors = {
  primary: colors.ink,
  secondary: colors.text,
  dark: colors.white,
  ghost: colors.text,
};

export const Button = forwardRef<View, ButtonProps>(function Button(
  { accessibilityState, disabled, icon, label, variant = 'primary', ...props },
  ref,
) {
  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityState={{ ...accessibilityState, disabled: Boolean(disabled) }}
      disabled={disabled}
      {...props}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text maxFontSizeMultiplier={1.8} style={[styles.label, labelStyles[variant]]}>{label}</Text>
      {icon ? <AppIcon color={iconColors[variant]} name={icon} size={19} /> : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: radius.pill,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  primary: { backgroundColor: colors.primaryBright, ...shadows.card },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dark: { backgroundColor: colors.ink },
  ghost: { backgroundColor: 'transparent' },
  label: { flexShrink: 1, fontSize: 16, fontWeight: '800', letterSpacing: -0.2, textAlign: 'center' },
  primaryLabel: { color: colors.ink },
  lightLabel: { color: colors.white },
  darkLabel: { color: colors.text },
  disabled: { opacity: 0.42 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] },
});

const variantStyles = {
  primary: styles.primary,
  secondary: styles.secondary,
  dark: styles.dark,
  ghost: styles.ghost,
};

const labelStyles = {
  primary: styles.primaryLabel,
  secondary: styles.darkLabel,
  dark: styles.lightLabel,
  ghost: styles.darkLabel,
};
