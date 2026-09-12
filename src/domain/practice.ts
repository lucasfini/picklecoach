export const practiceTypes = ['serve', 'dink', 'drive'] as const;

export type PracticeType = (typeof practiceTypes)[number];

export function isPracticeType(value: unknown): value is PracticeType {
  return typeof value === 'string' && practiceTypes.includes(value as PracticeType);
}
