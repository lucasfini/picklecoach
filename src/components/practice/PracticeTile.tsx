import { Link } from 'expo-router';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '@/src/components/ui/AppIcon';
import { practices } from '@/src/data/practices';
import { practiceImages } from '@/src/data/practiceVisuals';
import { PracticeType } from '@/src/domain/practice';
import { colors, radius, shadows } from '@/src/theme';

type PracticeTileProps = {
  practiceType: PracticeType;
};

export function PracticeTile({ practiceType }: PracticeTileProps) {
  const practice = practices[practiceType];

  return (
    <Link href={{ pathname: '/record/[shot]', params: { shot: practiceType } }} asChild>
      <Pressable
        accessibilityLabel={`Start ${practice.title} practice`}
        accessibilityRole="button"
        accessibilityHint="Opens phone placement guidance before the camera"
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <ImageBackground
          imageStyle={styles.image}
          resizeMode="cover"
          source={practiceImages[practiceType]}
          style={styles.imageBackground}
        >
          <View style={styles.shade} />
          <View style={styles.topRow}>
            <View style={styles.durationPill}>
              <AppIcon color={colors.white} name="time-outline" size={14} />
              <Text maxFontSizeMultiplier={1.5} style={styles.duration}>{practice.durationLabel}</Text>
            </View>
            <View style={styles.arrow}>
              <AppIcon color={colors.text} name="arrow-forward" size={17} />
            </View>
          </View>
          <View style={styles.copy}>
            <Text maxFontSizeMultiplier={1.5} style={styles.title}>{practice.title}</Text>
            <Text maxFontSizeMultiplier={1.7} numberOfLines={2} style={styles.description}>{practice.description}</Text>
          </View>
        </ImageBackground>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 238,
    minHeight: 286,
    borderRadius: radius.lg,
    backgroundColor: colors.ink,
    ...shadows.card,
  },
  imageBackground: { flex: 1, justifyContent: 'space-between', padding: 16, overflow: 'hidden', borderRadius: radius.lg },
  image: { borderRadius: radius.lg },
  shade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(5, 16, 11, 0.28)',
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(9, 24, 16, 0.58)',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  duration: { color: colors.white, fontSize: 11, fontWeight: '800' },
  arrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  copy: { gap: 5 },
  title: { color: colors.white, fontSize: 29, fontWeight: '900', letterSpacing: -0.9 },
  description: { color: 'rgba(255,255,255,0.88)', fontSize: 13, lineHeight: 18, fontWeight: '600' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
});
