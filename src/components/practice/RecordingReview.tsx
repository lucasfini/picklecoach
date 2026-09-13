import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/ui/AppIcon';
import { Button } from '@/src/components/ui/Button';
import { PracticeDefinition } from '@/src/data/practices';
import { formatRecordingDuration, RecordedPracticeSession } from '@/src/domain/recordedPracticeSession';
import { colors, radius } from '@/src/theme';

type RecordingReviewProps = {
  practice: PracticeDefinition;
  session: RecordedPracticeSession;
  contextLabel?: string;
  reviewInstruction?: string;
  onCancel: () => Promise<void>;
  onRetake: () => Promise<void>;
  onUseVideo: () => void;
};

export function RecordingReview({ contextLabel, practice, reviewInstruction, session, onCancel, onRetake, onUseVideo }: RecordingReviewProps) {
  const { fontScale, width } = useWindowDimensions();
  const stackActions = fontScale >= 1.5 || width < 350;
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const isDiscardingRef = useRef(false);
  const player = useVideoPlayer(session.videoUri, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.play();
  });

  const discard = useCallback(async (action: () => Promise<void>) => {
    if (isDiscardingRef.current) return;

    isDiscardingRef.current = true;
    setIsDiscarding(true);
    player.pause();
    try {
      await player.replaceAsync(null);
    } catch {
      // Continue with local cleanup even if the native player is already released.
    }
    await action();
  }, [player]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      void discard(onRetake);
      return true;
    });
    return () => subscription.remove();
  }, [discard, onRetake]);

  const useVideo = () => {
    if (isDiscardingRef.current) return;
    player.pause();
    onUseVideo();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Cancel session"
          accessibilityRole="button"
          disabled={isDiscarding}
          hitSlop={12}
          onPress={() => void discard(onCancel)}
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
        >
          <AppIcon color={colors.white} name="close" size={24} />
        </Pressable>
        <Text maxFontSizeMultiplier={1.5} style={styles.topTitle}>{contextLabel ?? `${practice.title} take`}</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <View style={styles.videoWrap}>
        <VideoView
          allowsVideoFrameAnalysis={false}
          contentFit="contain"
          nativeControls
          player={player}
          style={styles.video}
          onFirstFrameRender={() => setIsVideoReady(true)}
        />
        {!isVideoReady ? (
          <View pointerEvents="none" style={styles.videoLoading}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        ) : null}
      </View>

      <View style={styles.details}>
        <View style={styles.copyRow}>
          <View style={styles.copy}>
            <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.title}>How does it look?</Text>
            <Text style={styles.subtitle}>
              {reviewInstruction ?? 'Full body visible, with room around your paddle.'}
            </Text>
          </View>
          <View style={styles.durationPill}>
            <AppIcon color={colors.primary} name="time-outline" size={15} />
            <Text maxFontSizeMultiplier={1.5} style={styles.duration}>{formatRecordingDuration(session.duration)}</Text>
          </View>
        </View>

        <View style={styles.localNote}>
          <AppIcon color={colors.primary} name="phone-portrait-outline" size={15} />
          <Text style={styles.localText}>Temporary on this phone · deleted after review</Text>
        </View>

        <View style={[styles.actions, stackActions && styles.actionsStacked]}>
          <View style={styles.action}>
            <Button disabled={isDiscarding} icon="refresh" label="Retake" onPress={() => void discard(onRetake)} variant="secondary" />
          </View>
          <View style={styles.action}>
            <Button disabled={isDiscarding} icon="arrow-forward" label="Use video" onPress={useVideo} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.ink },
  topBar: { minHeight: 58, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  closeButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  topTitle: { color: colors.white, fontSize: 14, fontWeight: '800' },
  topBarSpacer: { width: 40 },
  videoWrap: { flex: 1, minHeight: 280, backgroundColor: '#000000' },
  video: { flex: 1 },
  videoLoading: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  details: { gap: 15, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8, backgroundColor: colors.background, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  copyRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 12 },
  copy: { flex: 1, gap: 4 },
  title: { color: colors.text, fontSize: 25, lineHeight: 30, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  durationPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: colors.primarySoft },
  duration: { color: colors.primary, fontSize: 11, fontWeight: '900', fontVariant: ['tabular-nums'] },
  localNote: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  localText: { color: colors.subtle, fontSize: 11, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10 },
  actionsStacked: { flexDirection: 'column' },
  action: { flex: 1 },
  pressed: { opacity: 0.65 },
});
