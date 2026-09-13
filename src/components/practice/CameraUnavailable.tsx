import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/ui/AppIcon';
import { Button } from '@/src/components/ui/Button';
import { colors } from '@/src/theme';

type CameraUnavailableProps = {
  isChecking: boolean;
  detail?: string;
  onRetry: () => void;
  onBack: () => void;
};

export function CameraUnavailable({ isChecking, detail, onRetry, onBack }: CameraUnavailableProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Back to camera setup"
          accessibilityRole="button"
          hitSlop={12}
          onPress={onBack}
          style={styles.backButton}
        >
          <AppIcon color={colors.text} name="chevron-back" size={22} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.iconWrap, !isChecking && styles.errorIconWrap]}>
          {isChecking ? (
            <ActivityIndicator color={colors.primary} size="large" />
          ) : (
            <AppIcon color={colors.coral} name="camera-outline" size={46} />
          )}
        </View>
        <View style={styles.copy}>
          <Text maxFontSizeMultiplier={1.5} style={styles.eyebrow}>{isChecking ? 'GETTING READY' : 'CAMERA UNAVAILABLE'}</Text>
          <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.title}>{isChecking ? 'Warming up the camera…' : 'The camera needs another try.'}</Text>
          <Text style={styles.body}>
            {isChecking ? 'This should only take a moment.' : detail ?? 'Use a physical iPhone with an available rear camera.'}
          </Text>
        </View>
        {!isChecking ? <Button icon="refresh" label="Try camera again" onPress={onRetry} /> : null}
        <Button label="Back to setup" onPress={onBack} variant="ghost" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  topBar: { minHeight: 54, justifyContent: 'center', paddingHorizontal: 18 },
  backButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingTop: 12, paddingBottom: 70, gap: 16 },
  iconWrap: { alignSelf: 'center', width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, marginBottom: 10 },
  errorIconWrap: { backgroundColor: colors.coralSoft },
  copy: { alignItems: 'center', gap: 8, marginBottom: 6 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: colors.text, fontSize: 32, lineHeight: 38, fontWeight: '900', letterSpacing: -1, textAlign: 'center' },
  body: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
});
