import { PlayerGoal } from '@/src/domain/playerProfile';
import { PracticeType, practiceTypes } from '@/src/domain/practice';

type PracticeActivitySummary = {
  practiceType: PracticeType;
  capturedAt: string;
};

const practiceByGoal: Partial<Record<PlayerGoal, PracticeType>> = {
  serve: 'serve',
  'soft-game': 'dink',
  drives: 'drive',
};

export function startOfPracticeWeek(now: Date = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

export function getPracticeWeekDays(now: Date = new Date()) {
  const start = startOfPracticeWeek(now);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export function isSameLocalDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

export function activitiesInPracticeWeek(
  activities: PracticeActivitySummary[],
  now: Date = new Date(),
) {
  const weekStart = startOfPracticeWeek(now).getTime();
  const currentTime = now.getTime();
  return activities.filter((activity) => {
    const capturedAt = Date.parse(activity.capturedAt);
    return capturedAt >= weekStart && capturedAt <= currentTime;
  });
}

/**
 * Chooses practice, not technique feedback. Goal-linked skills are balanced by
 * this week's count, then by the least recently practiced skill.
 */
export function recommendNextPractice(
  goals: PlayerGoal[],
  activities: PracticeActivitySummary[],
  now: Date = new Date(),
): PracticeType {
  const focusedCandidates = goals.reduce<PracticeType[]>((candidates, goal) => {
    const practiceType = practiceByGoal[goal];
    return practiceType && !candidates.includes(practiceType)
      ? [...candidates, practiceType]
      : candidates;
  }, []);
  const candidates = focusedCandidates.length ? focusedCandidates : [...practiceTypes];
  const thisWeek = activitiesInPracticeWeek(activities, now);
  const currentTime = now.getTime();

  return candidates
    .map((practiceType, order) => ({
      practiceType,
      order,
      weeklyCount: thisWeek.filter((activity) => activity.practiceType === practiceType).length,
      lastPracticedAt: activities.reduce((latest, activity) => {
        if (activity.practiceType !== practiceType) return latest;
        const capturedAt = Date.parse(activity.capturedAt);
        return capturedAt <= currentTime ? Math.max(latest, capturedAt) : latest;
      }, Number.NEGATIVE_INFINITY),
    }))
    .sort((left, right) => (
      left.weeklyCount - right.weeklyCount ||
      left.lastPracticedAt - right.lastPracticedAt ||
      left.order - right.order
    ))[0].practiceType;
}
