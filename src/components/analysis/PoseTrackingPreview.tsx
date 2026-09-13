import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { PoseInspectionControls } from '@/src/components/analysis/PoseInspectionControls';
import { SkeletonOverlay } from '@/src/components/analysis/SkeletonOverlay';
import { AppIcon } from '@/src/components/ui/AppIcon';
import {
  formatPosePercentage,
  nearestPoseFrame,
  PoseExtractionResult,
} from '@/src/domain/poseTracking';
import { formatRecordingDuration } from '@/src/domain/recordedPracticeSession';
import { colors, radius } from '@/src/theme';

type PoseTrackingPreviewProps = {
  result: PoseExtractionResult;
  videoUri: string;
  inspectionMode?: boolean;
};

export function PoseTrackingPreview({ inspectionMode = false, result, videoUri }: PoseTrackingPreviewProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const player = useVideoPlayer(videoUri, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
    videoPlayer.timeUpdateEventInterval = 0.08;
    videoPlayer.play();
  });

  useEventListener(player, 'timeUpdate', ({ currentTime: nextTime }) => setCurrentTime(nextTime));
  useEventListener(player, 'playingChange', ({ isPlaying: nextIsPlaying }) => setIsPlaying(nextIsPlaying));

  const frame = useMemo(
    () => nearestPoseFrame(result.frames, currentTime),
    [currentTime, result.frames],
  );
  const currentFrameIndex = frame ? result.frames.indexOf(frame) : -1;
  const videoAspectRatio = Math.min(
    1.35,
    Math.max(0.76, result.video.width / result.video.height),
  );
  const trackingBadge = result.quality.status === 'usable'
    ? {
        backgroundStyle: styles.verifiedBadge,
        icon: 'checkmark-circle' as const,
        label: 'TRACKED',
        textStyle: styles.verifiedText,
        tone: colors.primary,
      }
    : result.quality.poseFrameCount > 0
      ? {
          backgroundStyle: styles.partialBadge,
          icon: 'alert-circle' as const,
          label: 'PARTIAL',
          textStyle: styles.partialText,
          tone: colors.warning,
        }
      : {
          backgroundStyle: styles.missingBadge,
          icon: 'close-circle' as const,
          label: 'NO POSE',
          textStyle: styles.missingText,
          tone: colors.danger,
        };

  const togglePlayback = () => {
    if (isPlaying) player.pause();
    else player.play();
  };

  const seekToSample = (timestamp: number) => {
    player.pause();
    player.currentTime = timestamp;
    setCurrentTime(timestamp);
  };

  return (
    <View style={styles.card}>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text maxFontSizeMultiplier={1.5} style={styles.eyebrow}>REAL ON-DEVICE TRACKING</Text>
          <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.title}>Skeleton preview</Text>
        </View>
        <View style={trackingBadge.backgroundStyle}>
          <AppIcon color={trackingBadge.tone} name={trackingBadge.icon} size={16} />
          <Text maxFontSizeMultiplier={1.4} style={trackingBadge.textStyle}>{trackingBadge.label}</Text>
        </View>
      </View>

      <View style={[styles.videoWrap, { aspectRatio: videoAspectRatio }]}>
        <VideoView
          allowsVideoFrameAnalysis={false}
          contentFit="contain"
          nativeControls={false}
          player={player}
          style={StyleSheet.absoluteFill}
          onFirstFrameRender={() => setIsReady(true)}
        />
        <SkeletonOverlay
          frame={frame}
          videoHeight={result.video.height}
          videoWidth={result.video.width}
        />

        {!isReady ? (
          <View pointerEvents="none" style={styles.loading}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        ) : null}

        <View style={styles.trackingStatus}>
          <View style={[styles.trackingDot, !frame?.poseDetected && styles.trackingDotLost]} />
          <Text maxFontSizeMultiplier={1.4} style={styles.trackingText}>{frame?.poseDetected ? 'BODY FOUND' : 'SEARCHING'}</Text>
        </View>

        <Pressable
          accessibilityLabel={isPlaying ? 'Pause skeleton preview' : 'Play skeleton preview'}
          accessibilityRole="button"
          onPress={togglePlayback}
          style={({ pressed }) => [styles.playButton, pressed && styles.pressed]}
        >
          <AppIcon color={colors.white} name={isPlaying ? 'pause' : 'play'} size={20} />
        </Pressable>

        <View pointerEvents="none" style={styles.timePill}>
          <Text maxFontSizeMultiplier={1.4} style={styles.timeText}>
            {formatRecordingDuration(currentTime)} / {formatRecordingDuration(result.video.duration)}
          </Text>
        </View>
      </View>

      <View style={styles.stats}>
        <TrackingStat label="FRAMES WITH BODY" value={formatPosePercentage(result.quality.poseCoverage)} />
        <View style={styles.statDivider} />
        <TrackingStat label="KEY JOINTS FOUND" value={formatPosePercentage(result.quality.keyJointCoverage)} />
        <View style={styles.statDivider} />
        <TrackingStat label="FRAMES CHECKED" value={String(result.sampling.sampledFrameCount)} />
      </View>

      {inspectionMode ? (
        <PoseInspectionControls
          currentFrameIndex={currentFrameIndex}
          frames={result.frames}
          onSeek={seekToSample}
        />
      ) : null}

      <View style={styles.provenanceRow}>
        <AppIcon color={colors.primary} name="phone-portrait-outline" size={15} />
        <Text maxFontSizeMultiplier={1.6} style={styles.provenance}>Apple Vision · landmarks only · no technique score</Text>
      </View>
    </View>
  );
}

function TrackingStat({ label, value }: { label: string; value: string }) {
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.stat}>
      <Text maxFontSizeMultiplier={1.5} style={styles.statValue}>{value}</Text>
      <Text maxFontSizeMultiplier={1.4} style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: 15, gap: 14, backgroundColor: colors.surface },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 3 },
  headingCopy: { flex: 1, gap: 3 },
  eyebrow: { color: colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 0.9 },
  title: { color: colors.text, fontSize: 23, lineHeight: 28, fontWeight: '900', letterSpacing: -0.55 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 7, backgroundColor: colors.primarySoft },
  verifiedText: { color: colors.primary, fontSize: 8, fontWeight: '900', letterSpacing: 0.6 },
  partialBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 7, backgroundColor: colors.warningSoft },
  partialText: { color: colors.warning, fontSize: 8, fontWeight: '900', letterSpacing: 0.6 },
  missingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 7, backgroundColor: colors.dangerSoft },
  missingText: { color: colors.danger, fontSize: 8, fontWeight: '900', letterSpacing: 0.6 },
  videoWrap: { width: '100%', minHeight: 248, maxHeight: 460, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.ink },
  loading: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink },
  trackingStatus: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 7, backgroundColor: 'rgba(8,20,14,0.72)' },
  trackingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primaryBright },
  trackingDotLost: { backgroundColor: colors.coral },
  trackingText: { color: colors.white, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  playButton: { position: 'absolute', left: 12, bottom: 12, width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(8,20,14,0.78)' },
  timePill: { position: 'absolute', right: 12, bottom: 15, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: 'rgba(8,20,14,0.72)' },
  timeText: { color: colors.white, fontSize: 9, fontWeight: '800', fontVariant: ['tabular-nums'] },
  pressed: { opacity: 0.65 },
  stats: { flexDirection: 'row', alignItems: 'stretch', borderRadius: radius.md, paddingVertical: 12, backgroundColor: colors.primaryMist },
  stat: { flex: 1, alignItems: 'center', gap: 4, paddingHorizontal: 4 },
  statValue: { color: colors.primary, fontSize: 18, fontWeight: '900', letterSpacing: -0.4 },
  statLabel: { color: colors.muted, fontSize: 7, lineHeight: 10, fontWeight: '900', letterSpacing: 0.4, textAlign: 'center' },
  statDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  provenanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  provenance: { color: colors.subtle, fontSize: 10, fontWeight: '700' },
});
