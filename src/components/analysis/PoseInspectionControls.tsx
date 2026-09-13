import { useMemo, useState } from 'react';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppIcon } from '@/src/components/ui/AppIcon';
import {
  calculateKeyJointCoverage,
  formatPosePercentage,
  poseJointNames,
  PoseFrame,
  PoseJointName,
} from '@/src/domain/poseTracking';
import { colors, radius } from '@/src/theme';

type PoseInspectionControlsProps = {
  currentFrameIndex: number;
  frames: PoseFrame[];
  onSeek: (timestamp: number) => void;
};

const jointLabels: Record<PoseJointName, string> = {
  nose: 'Nose',
  neck: 'Neck',
  root: 'Root',
  leftEye: 'Left eye',
  rightEye: 'Right eye',
  leftEar: 'Left ear',
  rightEar: 'Right ear',
  leftShoulder: 'Left shoulder',
  rightShoulder: 'Right shoulder',
  leftElbow: 'Left elbow',
  rightElbow: 'Right elbow',
  leftWrist: 'Left wrist',
  rightWrist: 'Right wrist',
  leftHip: 'Left hip',
  rightHip: 'Right hip',
  leftKnee: 'Left knee',
  rightKnee: 'Right knee',
  leftAnkle: 'Left ankle',
  rightAnkle: 'Right ankle',
};

function frameColor(frame: PoseFrame) {
  if (frame.frameError === 'vision-request-failed') return colors.danger;
  if (frame.personCount > 1) return colors.warning;
  if (!frame.poseDetected) return colors.coral;
  return colors.primaryBright;
}

function frameDetail(frame: PoseFrame | undefined) {
  if (!frame) return 'No sampled frame selected';
  if (frame.frameError === 'vision-request-failed') return 'Vision processing failed on this frame';
  if (!frame.poseDetected) return 'No body landmarks found';

  const jointCount = poseJointNames.reduce(
    (count, name) => count + (frame.landmarks[name] ? 1 : 0),
    0,
  );
  const people = frame.personCount === 1 ? '1 person' : `${frame.personCount} people`;
  return `${jointCount} of ${poseJointNames.length} joints · ${people}`;
}

export function PoseInspectionControls({
  currentFrameIndex,
  frames,
  onSeek,
}: PoseInspectionControlsProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const boundedIndex = Math.max(0, Math.min(currentFrameIndex, frames.length - 1));
  const currentFrame = frames[boundedIndex];
  const canGoPrevious = boundedIndex > 0;
  const canGoNext = boundedIndex >= 0 && boundedIndex < frames.length - 1;
  const cursorProgress = frames.length > 1 ? boundedIndex / (frames.length - 1) : 0;
  const weakestKeyJoints = useMemo(
    () => calculateKeyJointCoverage(frames)
      .sort((left, right) => left.coverage - right.coverage)
      .slice(0, 6),
    [frames],
  );
  const timelineSegments = useMemo(
    () => frames.map((frame, index) => (
      <View
        key={`${frame.timestamp}-${index}`}
        style={[styles.segment, { backgroundColor: frameColor(frame) }]}
      />
    )),
    [frames],
  );

  const seekToIndex = (index: number) => {
    const frame = frames[Math.max(0, Math.min(index, frames.length - 1))];
    if (frame) onSeek(frame.timestamp);
  };

  const handleTrackLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    setTrackWidth(nativeEvent.layout.width);
  };

  const handleTrackPress = ({ nativeEvent }: GestureResponderEvent) => {
    if (!trackWidth || !frames.length) return;
    const progress = Math.max(0, Math.min(1, nativeEvent.locationX / trackWidth));
    seekToIndex(Math.round(progress * (frames.length - 1)));
  };

  if (!frames.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <Text maxFontSizeMultiplier={1.5} style={styles.heading}>FRAME INSPECTION</Text>
        <Text maxFontSizeMultiplier={1.5} style={styles.frameNumber}>
          {boundedIndex + 1} / {frames.length} · {currentFrame.timestamp.toFixed(2)}s
        </Text>
      </View>

      <Pressable
        accessibilityActions={[
          { name: 'decrement', label: 'Previous sampled frame' },
          { name: 'increment', label: 'Next sampled frame' },
        ]}
        accessibilityHint="Swipe up or down, or tap along the timeline, to inspect a sampled frame."
        accessibilityLabel="Pose tracking timeline"
        accessibilityRole="adjustable"
        accessibilityValue={{
          max: frames.length,
          min: 1,
          now: boundedIndex + 1,
          text: frameDetail(currentFrame),
        }}
        onAccessibilityAction={({ nativeEvent }) => {
          if (nativeEvent.actionName === 'decrement' && canGoPrevious) {
            seekToIndex(boundedIndex - 1);
          }
          if (nativeEvent.actionName === 'increment' && canGoNext) {
            seekToIndex(boundedIndex + 1);
          }
        }}
        onLayout={handleTrackLayout}
        onPress={handleTrackPress}
        style={({ pressed }) => [styles.track, pressed && styles.pressed]}
      >
        <View accessible={false} pointerEvents="none" style={styles.segments}>
          {timelineSegments}
        </View>
        <View
          pointerEvents="none"
          style={[styles.cursor, { left: Math.max(0, cursorProgress * trackWidth - 2) }]}
        />
      </Pressable>

      <View accessible accessibilityLabel="Timeline key: body found, no body, multiple people, processing error" style={styles.legend}>
        <LegendDot color={colors.primaryBright} label="BODY" />
        <LegendDot color={colors.coral} label="MISSING" />
        <LegendDot color={colors.warning} label="MULTI" />
        <LegendDot color={colors.danger} label="ERROR" />
      </View>

      <View style={styles.stepper}>
        <Pressable
          accessibilityLabel="Previous sampled frame"
          accessibilityRole="button"
          disabled={!canGoPrevious}
          hitSlop={8}
          onPress={() => seekToIndex(boundedIndex - 1)}
          style={({ pressed }) => [
            styles.stepButton,
            !canGoPrevious && styles.stepButtonDisabled,
            pressed && styles.pressed,
          ]}
        >
          <AppIcon color={colors.primary} name="chevron-back" size={21} />
        </Pressable>

        <View style={styles.frameCopy}>
          <Text maxFontSizeMultiplier={1.5} style={styles.frameDetail}>{frameDetail(currentFrame)}</Text>
          <Text maxFontSizeMultiplier={1.5} style={styles.frameHint}>Playback pauses while you inspect.</Text>
        </View>

        <Pressable
          accessibilityLabel="Next sampled frame"
          accessibilityRole="button"
          disabled={!canGoNext}
          hitSlop={8}
          onPress={() => seekToIndex(boundedIndex + 1)}
          style={({ pressed }) => [
            styles.stepButton,
            !canGoNext && styles.stepButtonDisabled,
            pressed && styles.pressed,
          ]}
        >
          <AppIcon color={colors.primary} name="chevron-forward" size={21} />
        </Pressable>
      </View>

      <View style={styles.jointSection}>
        <View style={styles.jointHeadingRow}>
          <Text maxFontSizeMultiplier={1.5} style={styles.jointHeading}>LOWEST KEY-JOINT COVERAGE</Text>
          <Text maxFontSizeMultiplier={1.5} style={styles.jointNote}>TRACKING ONLY</Text>
        </View>
        <View style={styles.jointGrid}>
          {weakestKeyJoints.map((item) => (
            <View
              key={item.joint}
              accessible
              accessibilityLabel={`${jointLabels[item.joint]} tracking coverage ${formatPosePercentage(item.coverage)}`}
              style={styles.jointItem}
            >
              <View style={styles.jointCopyRow}>
                <Text maxFontSizeMultiplier={1.4} numberOfLines={1} style={styles.jointLabel}>{jointLabels[item.joint]}</Text>
                <Text maxFontSizeMultiplier={1.4} style={styles.jointValue}>{formatPosePercentage(item.coverage)}</Text>
              </View>
              <View style={styles.jointTrack}>
                <View
                  style={[
                    styles.jointFill,
                    item.coverage < 0.55
                      ? styles.jointFillLow
                      : item.coverage < 0.8
                        ? styles.jointFillPartial
                        : null,
                    { width: `${Math.round(item.coverage * 100)}%` },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text maxFontSizeMultiplier={1.4} style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10, borderRadius: radius.md, padding: 13, backgroundColor: colors.primaryMist },
  headingRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  heading: { color: colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 0.85 },
  frameNumber: { color: colors.text, fontSize: 10, fontWeight: '900', fontVariant: ['tabular-nums'] },
  track: { height: 34, borderRadius: 10, justifyContent: 'center', overflow: 'hidden', backgroundColor: colors.surfaceMuted },
  segments: { height: 18, flexDirection: 'row', overflow: 'hidden' },
  segment: { minWidth: 1, flex: 1 },
  cursor: { position: 'absolute', top: 3, bottom: 3, width: 4, borderRadius: 2, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.ink },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendLabel: { color: colors.subtle, fontSize: 7, fontWeight: '900', letterSpacing: 0.45 },
  stepper: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 9 },
  stepButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  stepButtonDisabled: { opacity: 0.35 },
  frameCopy: { flex: 1, alignItems: 'center', gap: 2 },
  frameDetail: { color: colors.text, fontSize: 11, lineHeight: 15, fontWeight: '800', textAlign: 'center' },
  frameHint: { color: colors.subtle, fontSize: 9, lineHeight: 13, textAlign: 'center' },
  jointSection: { gap: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 11 },
  jointHeadingRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 6 },
  jointHeading: { color: colors.primary, fontSize: 8, fontWeight: '900', letterSpacing: 0.65 },
  jointNote: { color: colors.subtle, fontSize: 7, fontWeight: '900', letterSpacing: 0.55 },
  jointGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  jointItem: { minWidth: 122, flexBasis: '47%', flexGrow: 1, gap: 5 },
  jointCopyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  jointLabel: { flex: 1, color: colors.muted, fontSize: 9, fontWeight: '800' },
  jointValue: { color: colors.text, fontSize: 9, fontWeight: '900', fontVariant: ['tabular-nums'] },
  jointTrack: { height: 5, borderRadius: 3, overflow: 'hidden', backgroundColor: colors.surfaceMuted },
  jointFill: { height: '100%', borderRadius: 3, backgroundColor: colors.primaryBright },
  jointFillPartial: { backgroundColor: colors.warning },
  jointFillLow: { backgroundColor: colors.coral },
  pressed: { opacity: 0.7 },
});
