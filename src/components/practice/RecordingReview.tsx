import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PracticeDefinition } from '@/src/data/practices';
import {
  formatRecordingDuration,
  RecordedPracticeSession,
} from '@/src/domain/recordedPracticeSession';
import { colors, radius } from '@/src/theme';

type RecordingReviewProps = {
  practice: PracticeDefinition;
  session: RecordedPracticeSession;
  onCancel: () => Promise<void>;
  onRetake: () => Promise<void>;
  onUseVideo: () => void;
};

export function RecordingReview({
  practice,
  session,
  onCancel,
  onRetake,
  onUseVideo,
}: RecordingReviewProps) {
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const isDiscardingRef = useRef(false);
  const player = useVideoPlayer(session.videoUri, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.play();
  });

  const discard = useCallback(
    async (action: () => Promise<void>) => {
      if (isDiscardingRef.current) {
        return;
      }

      isDiscardingRef.current = true;
      setIsDiscarding(true);
      player.pause();
      try {
        await player.replaceAsync(null);
      } catch {
        // Continue with local cleanup even if the native player is already released.
      }
      await action();
    },
    [player],
  );

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      void discard(onRetake);
      return true;
    });

    return () => subscription.remove();
  }, [discard, onRetake]);

  const useVideo = () => {
    if (isDiscardingRef.current) {
      return;
    }

    player.pause();
    onUseVideo();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          disabled={isDiscarding}
          hitSlop={12}
          onPress={() => void discard(onCancel)}
        >
          <Text style={styles.cancelButton}>Cancel session</Text>
        </Pressable>
        <Text style={styles.topTitle}>Review {practice.title}</Text>
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
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : null}
      </View>

      <View style={styles.details}>
        <View>
          <Text style={styles.title}>Keep this take?</Text>
          <Text style={styles.subtitle}>Check that your full body and all 5 reps are visible.</Text>
        </View>
        <View style={styles.metadataRow}>
          <Text style={styles.metadata}>{formatRecordingDuration(session.duration)}</Text>
          <View style={styles.metadataDivider} />
          <Text style={styles.metadata}>Stored locally</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            disabled={isDiscarding}
            onPress={() => void discard(onRetake)}
            style={({ pressed }) => [
              styles.secondaryButton,
              isDiscarding && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.secondaryButtonText}>Retake</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={isDiscarding}
            onPress={useVideo}
            style={({ pressed }) => [
              styles.primaryButton,
              isDiscarding && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Use Video</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#070A08' },
  topBar: {
    minHeight: 56,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancelButton: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', minWidth: 94 },
  topTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  topBarSpacer: { width: 94 },
  videoWrap: { flex: 1, minHeight: 280, backgroundColor: '#000000' },
  video: { flex: 1 },
  videoLoading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    backgroundColor: colors.background,
  },
  title: { color: colors.text, fontSize: 24, lineHeight: 30, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 4 },
  metadataRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  metadata: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  metadataDivider: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.muted },
  actions: { flexDirection: 'row', gap: 12 },
  primaryButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  secondaryButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  secondaryButtonText: { color: colors.text, fontSize: 16, fontWeight: '900' },
  buttonPressed: { opacity: 0.82 },
  buttonDisabled: { opacity: 0.5 },
});
