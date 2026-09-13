import { ImageBackground, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Button } from '@/src/components/ui/Button';
import { AppIcon, AppIconName } from '@/src/components/ui/AppIcon';
import { Tag } from '@/src/components/ui/Tag';
import { PracticeDefinition } from '@/src/data/practices';
import { practiceImages } from '@/src/data/practiceVisuals';
import { PoseBenchmarkCase } from '@/src/domain/poseBenchmarkProtocol';
import { PracticeType } from '@/src/domain/practice';
import { colors, radius, shadows } from '@/src/theme';

type CameraSetupProps = {
  practice: PracticeDefinition;
  practiceType: PracticeType;
  benchmarkCase?: PoseBenchmarkCase;
  onContinue: () => void;
};

export function CameraSetup({ benchmarkCase, practice, practiceType, onContinue }: CameraSetupProps) {
  const { fontScale, width } = useWindowDimensions();
  const stackSetupItems = fontScale >= 1.35 || width < 360;
  const setupItems: { icon: AppIconName; label: string; value: string }[] = [
    { icon: 'resize-outline', label: 'DISTANCE', value: practice.setup.distance },
    { icon: 'scan-outline', label: 'ANGLE', value: practice.setup.angle },
    { icon: 'phone-portrait-outline', label: 'PHONE', value: practice.setup.orientation },
    { icon: 'body-outline', label: 'FRAME', value: practice.setup.framing },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text maxFontSizeMultiplier={1.5} style={styles.eyebrow}>
          {benchmarkCase ? `${benchmarkCase.id} · POSE BENCHMARK` : `${practice.title.toUpperCase()} PRACTICE`}
        </Text>
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.title}>
          {benchmarkCase ? benchmarkCase.title : 'Set the phone once.'}
        </Text>
        <Text style={styles.subtitle}>
          {benchmarkCase ? benchmarkCase.detail : 'Then forget about it and play five natural reps.'}
        </Text>
      </View>

      {benchmarkCase ? (
        <View style={styles.benchmarkNotice}>
          <View style={styles.benchmarkIcon}>
            <AppIcon color={colors.warning} name="flask-outline" size={20} />
          </View>
          <Text style={styles.benchmarkText}>
            Controlled test: follow the case above even when it intentionally breaks the normal guide.
          </Text>
        </View>
      ) : null}

      <ImageBackground
        imageStyle={styles.previewImage}
        resizeMode="cover"
        source={practiceImages[practiceType]}
        style={styles.preview}
      >
        <View style={styles.previewShade} />
        <View style={styles.previewTop}>
          <Tag tone="lime">5 REPS</Tag>
          <View style={styles.timePill}>
            <AppIcon color={colors.white} name="timer-outline" size={15} />
            <Text maxFontSizeMultiplier={1.5} style={styles.timeText}>30 sec max</Text>
          </View>
        </View>
        <View style={styles.frameGuide}>
          <Text maxFontSizeMultiplier={1.4} style={styles.frameLabel}>KEEP YOUR FULL BODY HERE</Text>
        </View>
      </ImageBackground>

      <View style={[styles.setupGrid, stackSetupItems && styles.setupGridStacked]}>
        {setupItems.map((item) => (
          <View key={item.label} style={[styles.setupItem, stackSetupItems && styles.setupItemStacked]}>
            <View style={styles.setupIcon}>
              <AppIcon color={colors.primary} name={item.icon} size={21} />
            </View>
            <Text style={styles.setupLabel}>{item.label}</Text>
            <Text style={styles.setupValue}>{item.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.lightTip}>
        <View style={styles.lightIcon}>
          <AppIcon color={colors.warning} name="sunny-outline" size={22} />
        </View>
        <View style={styles.tipCopy}>
          <Text style={styles.tipTitle}>Good light matters</Text>
          <Text style={styles.tipBody}>Avoid strong backlight and keep the phone still.</Text>
        </View>
      </View>

      <Button icon="camera" label={benchmarkCase ? `Record ${benchmarkCase.id}` : 'Open camera'} onPress={onContinue} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, paddingBottom: 42, gap: 20, backgroundColor: colors.background },
  header: { gap: 7, paddingTop: 3 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.35 },
  title: { color: colors.text, fontSize: 36, lineHeight: 40, fontWeight: '900', letterSpacing: -1.3 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 21 },
  benchmarkNotice: { borderRadius: radius.md, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: colors.warningSoft },
  benchmarkIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  benchmarkText: { flex: 1, color: colors.text, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  preview: {
    height: 310,
    borderRadius: radius.lg,
    overflow: 'hidden',
    padding: 15,
    justifyContent: 'space-between',
    ...shadows.floating,
  },
  previewImage: { borderRadius: radius.lg },
  previewShade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(5,16,10,0.25)',
  },
  previewTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timePill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: 'rgba(7,20,13,0.58)' },
  timeText: { color: colors.white, fontSize: 11, fontWeight: '800' },
  frameGuide: { alignSelf: 'center', width: '53%', height: '73%', borderWidth: 2, borderColor: 'rgba(255,255,255,0.84)', borderStyle: 'dashed', alignItems: 'center' },
  frameLabel: { marginTop: 9, color: colors.white, fontSize: 9, fontWeight: '900', letterSpacing: 0.4, backgroundColor: 'rgba(7,20,13,0.58)', paddingHorizontal: 8, paddingVertical: 5 },
  setupGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  setupGridStacked: { flexDirection: 'column' },
  setupItem: { flexGrow: 1, flexBasis: '47%', minHeight: 118, borderRadius: radius.md, padding: 12, backgroundColor: colors.surface, ...shadows.card },
  setupItemStacked: { minHeight: 104 },
  setupIcon: { width: 39, height: 39, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, marginBottom: 12 },
  setupLabel: { color: colors.subtle, fontSize: 8, fontWeight: '900', letterSpacing: 0.85, marginBottom: 4 },
  setupValue: { color: colors.text, fontSize: 12, lineHeight: 16, fontWeight: '800' },
  lightTip: { borderRadius: radius.md, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.warningSoft },
  lightIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  tipCopy: { flex: 1, gap: 3 },
  tipTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  tipBody: { color: colors.muted, fontSize: 12, lineHeight: 17 },
});
