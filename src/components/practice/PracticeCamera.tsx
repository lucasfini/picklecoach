import { CameraView } from 'expo-camera';
import { useKeepAwake } from 'expo-keep-awake';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  AppState,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PracticeDefinition } from '@/src/data/practices';
import {
  formatRecordingDuration,
  isRecordingDurationLongEnough,
  MAX_RECORDING_DURATION_SECONDS,
  MAX_RECORDING_FILE_SIZE_BYTES,
  MIN_RECORDING_DURATION_SECONDS,
  RECORDING_COUNTDOWN_SECONDS,
  RECORDING_VIDEO_ASPECT_RATIO,
  RECORDING_VIDEO_QUALITY,
} from '@/src/domain/recordedPracticeSession';
import { adoptLocalRecording, deleteLocalRecording } from '@/src/services/localRecordingFiles';
import { colors } from '@/src/theme';

type CompletedRecording = {
  videoUri: string;
  duration: number;
};

type PracticeCameraProps = {
  practice: PracticeDefinition;
  contextLabel?: string;
  frameInstruction?: string;
  positionHint?: string;
  onCancel: () => void;
  onRecorded: (recording: CompletedRecording) => void;
  onUnavailable: (message: string) => void;
};

export function PracticeCamera({
  contextLabel,
  frameInstruction,
  positionHint,
  practice,
  onCancel,
  onRecorded,
  onUnavailable,
}: PracticeCameraProps) {
  useKeepAwake('picklecoach-practice-camera');

  const cameraRef = useRef<CameraView>(null);
  const mountedRef = useRef(true);
  const isRecordingRef = useRef(false);
  const isStoppingRef = useRef(false);
  const cancelRequestedRef = useRef(false);
  const didNotifyCancelRef = useRef(false);
  const startedAtRef = useRef(0);
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownValueRef = useRef<number | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const clearTimers = useCallback(() => {
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }

    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }

    if (countdownTimeoutRef.current) {
      clearTimeout(countdownTimeoutRef.current);
      countdownTimeoutRef.current = null;
    }
  }, []);

  const cancelCountdown = useCallback(() => {
    if (countdownTimeoutRef.current) {
      clearTimeout(countdownTimeoutRef.current);
      countdownTimeoutRef.current = null;
    }
    countdownValueRef.current = null;
    setCountdownSeconds(null);
  }, []);

  const finishCancel = useCallback(() => {
    if (didNotifyCancelRef.current || !mountedRef.current) {
      return;
    }

    didNotifyCancelRef.current = true;
    onCancel();
  }, [onCancel]);

  const stopRecording = useCallback(() => {
    if (!isRecordingRef.current || isStoppingRef.current) {
      return;
    }

    isStoppingRef.current = true;
    setIsStopping(true);
    cameraRef.current?.stopRecording();
  }, []);

  const cancelCamera = useCallback(() => {
    if (cancelRequestedRef.current) {
      return;
    }

    cancelRequestedRef.current = true;

    if (countdownValueRef.current !== null) {
      cancelCountdown();
      finishCancel();
      return;
    }

    if (isRecordingRef.current) {
      isStoppingRef.current = true;
      if (mountedRef.current) {
        setIsStopping(true);
      }
      cameraRef.current?.stopRecording();
      return;
    }

    finishCancel();
  }, [cancelCountdown, finishCancel]);

  const startRecording = useCallback(async () => {
    const camera = cameraRef.current;

    if (!camera || !isReady || isRecordingRef.current) {
      return;
    }

    cancelRequestedRef.current = false;
    didNotifyCancelRef.current = false;
    isRecordingRef.current = true;
    startedAtRef.current = Date.now();
    setElapsedSeconds(0);
    setRecordingError(null);
    isStoppingRef.current = false;
    setIsStopping(false);
    setIsRecording(true);

    elapsedIntervalRef.current = setInterval(() => {
      const elapsed = Math.min(
        MAX_RECORDING_DURATION_SECONDS,
        Math.floor((Date.now() - startedAtRef.current) / 1000),
      );

      if (mountedRef.current) {
        setElapsedSeconds(elapsed);
      }
    }, 250);

    autoStopTimeoutRef.current = setTimeout(() => {
      stopRecording();
    }, MAX_RECORDING_DURATION_SECONDS * 1000);

    try {
      const result = await camera.recordAsync({
        maxDuration: MAX_RECORDING_DURATION_SECONDS,
        maxFileSize: MAX_RECORDING_FILE_SIZE_BYTES,
      });
      const measuredDuration = Math.min(
        MAX_RECORDING_DURATION_SECONDS,
        Math.max(0.1, (Date.now() - startedAtRef.current) / 1000),
      );
      const duration = Math.round(measuredDuration * 10) / 10;

      if (result?.uri) {
        if (cancelRequestedRef.current) {
          await deleteLocalRecording(result.uri);
        } else if (!isRecordingDurationLongEnough(duration)) {
          await deleteLocalRecording(result.uri);
          if (mountedRef.current) {
            setRecordingError(`Keep the camera rolling for at least ${MIN_RECORDING_DURATION_SECONDS} seconds so we can see the full set.`);
          }
        } else {
          const managedVideoUri = await adoptLocalRecording(result.uri);
          if (mountedRef.current) {
            onRecorded({ videoUri: managedVideoUri, duration });
          } else {
            await deleteLocalRecording(managedVideoUri);
          }
        }
      } else if (!cancelRequestedRef.current && mountedRef.current) {
        setRecordingError('The recording did not save. Please try again.');
      }
    } catch (error) {
      if (!cancelRequestedRef.current && mountedRef.current) {
        console.warn('Practice recording failed.', error);
        setRecordingError('We could not save that recording. Please try again.');
      }
    } finally {
      clearTimers();
      isRecordingRef.current = false;
      isStoppingRef.current = false;

      if (mountedRef.current) {
        setIsRecording(false);
        setIsStopping(false);
      }

      if (cancelRequestedRef.current) {
        finishCancel();
      }
    }
  }, [clearTimers, finishCancel, isReady, onRecorded, stopRecording]);

  const startCountdown = useCallback(() => {
    if (!isReady || isRecordingRef.current || countdownValueRef.current !== null) {
      return;
    }

    cancelRequestedRef.current = false;
    didNotifyCancelRef.current = false;
    setRecordingError(null);
    countdownValueRef.current = RECORDING_COUNTDOWN_SECONDS;
    setCountdownSeconds(RECORDING_COUNTDOWN_SECONDS);
    void AccessibilityInfo.announceForAccessibility(`Recording in ${RECORDING_COUNTDOWN_SECONDS}`);

    const advanceCountdown = () => {
      const currentValue = countdownValueRef.current;
      if (currentValue === null) return;
      const nextValue = currentValue - 1;

      if (nextValue <= 0) {
        countdownValueRef.current = null;
        countdownTimeoutRef.current = null;
        if (mountedRef.current) {
          setCountdownSeconds(null);
          Vibration.vibrate(120);
          void AccessibilityInfo.announceForAccessibility('Recording started');
          void startRecording();
        }
        return;
      }

      countdownValueRef.current = nextValue;
      if (mountedRef.current) {
        setCountdownSeconds(nextValue);
        void AccessibilityInfo.announceForAccessibility(String(nextValue));
      }
      countdownTimeoutRef.current = setTimeout(advanceCountdown, 1000);
    };

    countdownTimeoutRef.current = setTimeout(advanceCountdown, 1000);
  }, [isReady, startRecording]);

  useEffect(() => {
    mountedRef.current = true;
    const backSubscription = BackHandler.addEventListener('hardwareBackPress', () => {
      cancelCamera();
      return true;
    });
    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active' && (isRecordingRef.current || countdownValueRef.current !== null)) {
        cancelCamera();
      }
    });

    return () => {
      mountedRef.current = false;
      backSubscription.remove();
      appStateSubscription.remove();
      clearTimers();

      if (isRecordingRef.current) {
        cancelRequestedRef.current = true;
        cameraRef.current?.stopRecording();
      }
    };
  }, [cancelCamera, clearTimers]);

  const isCountingDown = countdownSeconds !== null;

  return (
    <View style={styles.container}>
      <View style={styles.cameraStage}>
        <View style={styles.cameraFrame}>
          <CameraView
            ref={cameraRef}
            active
            facing="back"
            mode="video"
            mute
            style={StyleSheet.absoluteFill}
            videoQuality={RECORDING_VIDEO_QUALITY}
            onCameraReady={() => setIsReady(true)}
            onMountError={({ message }) => onUnavailable(message)}
          />
        </View>
      </View>

      <SafeAreaView style={styles.overlay}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" hitSlop={12} onPress={cancelCamera}>
            <Text maxFontSizeMultiplier={1.5} style={styles.cancelButton}>{isStopping && cancelRequestedRef.current ? 'Canceling…' : 'Cancel'}</Text>
          </Pressable>
          <View style={styles.practiceBadge}>
            <Text maxFontSizeMultiplier={1.4} style={styles.practiceBadgeText}>
              {contextLabel ?? practice.title.toUpperCase()}
            </Text>
          </View>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.frameArea} pointerEvents="none">
          <View style={styles.frameGuide}>
            <Text maxFontSizeMultiplier={1.4} style={styles.frameLabel}>
              {frameInstruction ?? 'KEEP FULL BODY INSIDE'}
            </Text>
          </View>
          <Text maxFontSizeMultiplier={1.5} style={styles.positionHint}>
            {positionHint ?? practice.cameraSummary}
          </Text>
          {isCountingDown ? (
            <View accessibilityLiveRegion="assertive" style={styles.countdownOverlay}>
              <Text maxFontSizeMultiplier={1.4} style={styles.countdownEyebrow}>GET INTO POSITION</Text>
              <Text allowFontScaling={false} style={styles.countdownNumber}>{countdownSeconds}</Text>
              <Text maxFontSizeMultiplier={1.5} style={styles.countdownNote}>Recording starts automatically</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.controls}>
          <View accessibilityLiveRegion="polite" style={styles.recordingStatus}>
            {isRecording ? <View style={styles.recordingDot} /> : null}
            <Text maxFontSizeMultiplier={1.4} style={styles.timer}>{formatRecordingDuration(elapsedSeconds)}</Text>
            <Text maxFontSizeMultiplier={1.4} style={styles.maxDuration}> / 0:30</Text>
          </View>

          {recordingError ? <Text maxFontSizeMultiplier={1.6} style={styles.error}>{recordingError}</Text> : null}

          <Pressable
            accessibilityLabel={isCountingDown ? 'Cancel countdown' : isRecording ? 'Stop recording' : 'Start recording'}
            accessibilityRole="button"
            disabled={!isReady || isStopping}
            onPress={isCountingDown ? cancelCountdown : isRecording ? stopRecording : startCountdown}
            style={({ pressed }) => [
              styles.recordButtonOuter,
              (!isReady || isStopping) && styles.recordButtonDisabled,
              pressed && styles.recordButtonPressed,
            ]}
          >
            {isCountingDown ? (
              <View style={styles.countdownButtonInner}>
                <Text allowFontScaling={false} style={styles.countdownButtonText}>×</Text>
              </View>
            ) : (
              <View style={isRecording ? styles.stopButtonInner : styles.recordButtonInner} />
            )}
          </Pressable>

          <Text maxFontSizeMultiplier={1.5} style={styles.controlHint}>
            {!isReady
              ? 'Starting camera…'
              : isStopping
                ? 'Finishing recording…'
                : isCountingDown
                  ? 'Tap to cancel countdown'
                : isRecording
                  ? elapsedSeconds < MIN_RECORDING_DURATION_SECONDS
                    ? `Keep going · ${MIN_RECORDING_DURATION_SECONDS - elapsedSeconds}s minimum`
                    : 'Tap to stop when your set is done'
                  : `Tap once · ${RECORDING_COUNTDOWN_SECONDS}s to get ready`}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070A08' },
  cameraStage: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraFrame: {
    width: '100%',
    aspectRatio: RECORDING_VIDEO_ASPECT_RATIO,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  overlay: { flex: 1, justifyContent: 'space-between' },
  topBar: {
    minHeight: 56,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(7,10,8,0.5)',
  },
  cancelButton: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', minWidth: 64 },
  practiceBadge: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(7,10,8,0.66)',
  },
  practiceBadgeText: { color: colors.accent, fontSize: 11, fontWeight: '900' },
  topBarSpacer: { width: 64 },
  frameArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  frameGuide: {
    width: '64%',
    maxWidth: 260,
    height: '72%',
    maxHeight: 490,
    minHeight: 230,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.82)',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  frameLabel: {
    marginTop: 12,
    color: '#FFFFFF',
    backgroundColor: 'rgba(7,10,8,0.64)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 10,
    fontWeight: '900',
  },
  positionHint: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: 'rgba(7,10,8,0.64)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 330,
  },
  countdownOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: 'rgba(7,10,8,0.62)',
  },
  countdownEyebrow: { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  countdownNumber: { color: '#FFFFFF', fontSize: 104, lineHeight: 112, fontWeight: '900', fontVariant: ['tabular-nums'] },
  countdownNote: { color: 'rgba(255,255,255,0.84)', fontSize: 13, fontWeight: '700' },
  controls: {
    minHeight: 190,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingTop: 14,
    gap: 10,
    backgroundColor: 'rgba(7,10,8,0.72)',
  },
  recordingStatus: { flexDirection: 'row', alignItems: 'baseline', minHeight: 28 },
  recordingDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#F04B4B',
    marginRight: 8,
  },
  timer: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', fontVariant: ['tabular-nums'] },
  maxDuration: { color: '#C8CECA', fontSize: 13, fontWeight: '700' },
  error: { color: '#FFD1CE', fontSize: 13, lineHeight: 18, textAlign: 'center' },
  recordButtonOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F04B4B' },
  stopButtonInner: { width: 30, height: 30, borderRadius: 4, backgroundColor: '#F04B4B' },
  countdownButtonInner: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)' },
  countdownButtonText: { color: '#FFFFFF', fontSize: 33, lineHeight: 36, fontWeight: '400' },
  recordButtonDisabled: { opacity: 0.45 },
  recordButtonPressed: { opacity: 0.72 },
  controlHint: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', minHeight: 18 },
});
