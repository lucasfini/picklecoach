import { isPracticeType, PracticeType } from '@/src/domain/practice';

export const MAX_RECORDING_DURATION_SECONDS = 30;

export type PracticeCaptureMetadata = {
  cameraFacing: 'back';
  maxDuration: number;
};

export type RecordedPracticeSession = {
  id: string;
  practiceType: PracticeType;
  videoUri: string;
  recordedAt: string;
  duration: number;
  captureMetadata: PracticeCaptureMetadata;
};

type RecordedPracticeSessionParams = {
  sessionId?: string | string[];
  shot?: string | string[];
  videoUri?: string | string[];
  recordedAt?: string | string[];
  duration?: string | string[];
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

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
      cameraFacing: 'back',
      maxDuration: MAX_RECORDING_DURATION_SECONDS,
    },
  };
}

export function toAnalysisRouteParams(session: RecordedPracticeSession) {
  return {
    sessionId: session.id,
    shot: session.practiceType,
    videoUri: session.videoUri,
    recordedAt: session.recordedAt,
    duration: String(session.duration),
  };
}

export function recordedPracticeSessionFromParams(
  params: RecordedPracticeSessionParams,
): RecordedPracticeSession | null {
  const id = firstParam(params.sessionId);
  const practiceType = firstParam(params.shot);
  const videoUri = firstParam(params.videoUri);
  const recordedAt = firstParam(params.recordedAt);
  const duration = Number(firstParam(params.duration));

  if (
    !id ||
    !isPracticeType(practiceType) ||
    !videoUri ||
    !recordedAt ||
    !Number.isFinite(Date.parse(recordedAt)) ||
    !Number.isFinite(duration) ||
    duration < 0 ||
    duration > MAX_RECORDING_DURATION_SECONDS
  ) {
    return null;
  }

  return {
    id,
    practiceType,
    videoUri,
    recordedAt,
    duration,
    captureMetadata: {
      cameraFacing: 'back',
      maxDuration: MAX_RECORDING_DURATION_SECONDS,
    },
  };
}

export function formatRecordingDuration(duration: number) {
  const wholeSeconds = Math.max(0, Math.floor(duration));
  const minutes = Math.floor(wholeSeconds / 60);
  const seconds = wholeSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
