import { PracticeType } from '@/src/domain/practice';

export const MAX_RECORDING_DURATION_SECONDS = 30;
export const MAX_RECORDING_FILE_SIZE_BYTES = 75 * 1024 * 1024;
export const MIN_RECORDING_DURATION_SECONDS = 5;
export const RECORDING_COUNTDOWN_SECONDS = 5;
export const RECORDING_VIDEO_QUALITY = '720p' as const;
export const RECORDING_VIDEO_ASPECT_RATIO = 9 / 16;

export type PracticeCaptureMetadata = {
  audioCaptured: false;
  cameraFacing: 'back';
  orientation: 'portrait';
  maxFileSizeBytes: typeof MAX_RECORDING_FILE_SIZE_BYTES;
  maxDuration: number;
  videoQuality: typeof RECORDING_VIDEO_QUALITY;
};

export type RecordedPracticeSession = {
  id: string;
  practiceType: PracticeType;
  videoUri: string;
  recordedAt: string;
  duration: number;
  captureMetadata: PracticeCaptureMetadata;
};

export function createRecordedPracticeSession({
  practiceType,
  videoUri,
  duration,
}: Pick<RecordedPracticeSession, 'practiceType' | 'videoUri' | 'duration'>): RecordedPracticeSession {
  const recordedAt = new Date().toISOString();

  return {
    id: `practice-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    practiceType,
    videoUri,
    recordedAt,
    duration: Math.min(MAX_RECORDING_DURATION_SECONDS, Math.max(0, duration)),
    captureMetadata: {
      audioCaptured: false,
      cameraFacing: 'back',
      orientation: 'portrait',
      maxFileSizeBytes: MAX_RECORDING_FILE_SIZE_BYTES,
      maxDuration: MAX_RECORDING_DURATION_SECONDS,
      videoQuality: RECORDING_VIDEO_QUALITY,
    },
  };
}

export function toAnalysisRouteParams(session: RecordedPracticeSession) {
  return {
    sessionId: session.id,
    shot: session.practiceType,
  };
}

export function isRecordingDurationLongEnough(duration: number) {
  return Number.isFinite(duration) && duration >= MIN_RECORDING_DURATION_SECONDS;
}

export function formatRecordingDuration(duration: number) {
  const wholeSeconds = Math.max(0, Math.floor(duration));
  const minutes = Math.floor(wholeSeconds / 60);
  const seconds = wholeSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
