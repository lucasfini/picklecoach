import { isPracticeType, PracticeType } from '@/src/domain/practice';
import { MAX_RECORDING_DURATION_SECONDS, RecordedPracticeSession } from '@/src/domain/recordedPracticeSession';

export const MAX_SAVED_PRACTICE_ACTIVITIES = 100;

export type PracticeActivity = {
  id: string;
  practiceType: PracticeType;
  capturedAt: string;
  duration: number;
  analysisMode: 'demo';
};

export function activityFromSession(session: RecordedPracticeSession): PracticeActivity {
  return {
    id: session.id,
    practiceType: session.practiceType,
    capturedAt: session.recordedAt,
    duration: session.duration,
    analysisMode: 'demo',
  };
}

export function addPracticeActivity(
  activities: PracticeActivity[],
  session: RecordedPracticeSession,
) {
  if (activities.some((activity) => activity.id === session.id)) {
    return activities;
  }

  return [activityFromSession(session), ...activities].slice(0, MAX_SAVED_PRACTICE_ACTIVITIES);
}

export function isPracticeActivity(value: unknown): value is PracticeActivity {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<PracticeActivity>;
  return (
    Object.keys(value).every((key) => [
      'id',
      'practiceType',
      'capturedAt',
      'duration',
      'analysisMode',
    ].includes(key)) &&
    typeof candidate.id === 'string' &&
    candidate.id.trim().length > 0 &&
    candidate.id.length <= 120 &&
    isPracticeType(candidate.practiceType) &&
    typeof candidate.capturedAt === 'string' &&
    Number.isFinite(Date.parse(candidate.capturedAt)) &&
    typeof candidate.duration === 'number' &&
    Number.isFinite(candidate.duration) &&
    candidate.duration > 0 &&
    candidate.duration <= MAX_RECORDING_DURATION_SECONDS &&
    candidate.analysisMode === 'demo'
  );
}
