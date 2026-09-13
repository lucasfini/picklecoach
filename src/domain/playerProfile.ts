export const playerLevels = [
  { id: 'new', label: 'New / 2.0', detail: 'Learning the basics' },
  { id: '2.5', label: '2.5', detail: 'Building consistency' },
  { id: '3.0', label: '3.0', detail: 'Rallying with purpose' },
  { id: '3.5', label: '3.5', detail: 'Adding placement and pace' },
  { id: '4.0+', label: '4.0+', detail: 'Refining patterns' },
  { id: 'unsure', label: 'Not sure', detail: 'We will help you place it' },
] as const;

export type PlayerLevel = (typeof playerLevels)[number]['id'];

export const playerGoals = [
  { id: 'consistency', label: 'More consistency', icon: 'repeat-outline' },
  { id: 'serve', label: 'A reliable serve', icon: 'locate-outline' },
  { id: 'soft-game', label: 'Better soft game', icon: 'hand-left-outline' },
  { id: 'drives', label: 'Stronger drives', icon: 'flash-outline' },
  { id: 'confidence', label: 'Match confidence', icon: 'sparkles-outline' },
] as const;

export type PlayerGoal = (typeof playerGoals)[number]['id'];

export type PlayerProfile = {
  id: 'local-player';
  level: PlayerLevel;
  goals: PlayerGoal[];
  weeklyTarget: number;
  completedOnboardingAt: string;
};

export type PlayerProfileInput = Pick<PlayerProfile, 'level' | 'goals'>;

export function createPlayerProfile(
  input: PlayerProfileInput,
  existingProfile?: PlayerProfile | null,
): PlayerProfile {
  return {
    id: 'local-player',
    level: input.level,
    goals: input.goals,
    weeklyTarget: existingProfile?.weeklyTarget ?? 3,
    completedOnboardingAt: existingProfile?.completedOnboardingAt ?? new Date().toISOString(),
  };
}

export function isPlayerLevel(value: unknown): value is PlayerLevel {
  return playerLevels.some((level) => level.id === value);
}

export function isPlayerGoal(value: unknown): value is PlayerGoal {
  return playerGoals.some((goal) => goal.id === value);
}

export function isPlayerProfile(value: unknown): value is PlayerProfile {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<PlayerProfile>;
  return (
    Object.keys(value).every((key) => [
      'id',
      'level',
      'goals',
      'weeklyTarget',
      'completedOnboardingAt',
    ].includes(key)) &&
    candidate.id === 'local-player' &&
    isPlayerLevel(candidate.level) &&
    Array.isArray(candidate.goals) &&
    candidate.goals.length > 0 &&
    candidate.goals.length <= 3 &&
    candidate.goals.every(isPlayerGoal) &&
    new Set(candidate.goals).size === candidate.goals.length &&
    Number.isInteger(candidate.weeklyTarget) &&
    Number(candidate.weeklyTarget) >= 1 &&
    Number(candidate.weeklyTarget) <= 7 &&
    typeof candidate.completedOnboardingAt === 'string' &&
    Number.isFinite(Date.parse(candidate.completedOnboardingAt))
  );
}
