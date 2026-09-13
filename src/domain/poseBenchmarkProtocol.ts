import { PracticeType } from '@/src/domain/practice';

export type PoseBenchmarkExpectation = 'usable' | 'retake' | 'evidence-decides';

export type PoseBenchmarkCase = {
  id: string;
  practiceType: PracticeType;
  title: string;
  detail: string;
  expectedGate: PoseBenchmarkExpectation;
};

export const poseBenchmarkCases = [
  { id: 'S01', practiceType: 'serve', title: 'Right-handed · outdoor shade', detail: 'Full body · rear 45°', expectedGate: 'usable' },
  { id: 'S02', practiceType: 'serve', title: 'Exact S01 source rerun', detail: 'Repeatability check', expectedGate: 'usable' },
  { id: 'S03', practiceType: 'serve', title: 'Left-handed · outdoor shade', detail: 'Full body · rear 45°', expectedGate: 'usable' },
  { id: 'S04', practiceType: 'serve', title: 'Right-handed · bright indoor', detail: 'Full body · rear 45°', expectedGate: 'usable' },
  { id: 'S05', practiceType: 'serve', title: 'Low or uneven indoor light', detail: 'Evidence decides', expectedGate: 'evidence-decides' },
  { id: 'S06', practiceType: 'serve', title: 'Player deliberately too far away', detail: 'Expect subject-too-small retake', expectedGate: 'retake' },
  { id: 'S07', practiceType: 'serve', title: 'Both feet deliberately cropped', detail: 'Expect full-body retake', expectedGate: 'retake' },
  { id: 'S08', practiceType: 'serve', title: 'Paddle arm deliberately exits frame', detail: 'Expect key-joint retake', expectedGate: 'retake' },
  { id: 'S09', practiceType: 'serve', title: 'Second player crosses the frame', detail: 'Expect multiple-people retake', expectedGate: 'retake' },
  { id: 'S10', practiceType: 'serve', title: 'Alternate supported distance', detail: 'Full body · rear 45°', expectedGate: 'usable' },
  { id: 'D01', practiceType: 'dink', title: 'Right-handed · outdoor', detail: 'Full body at kitchen line', expectedGate: 'usable' },
  { id: 'D02', practiceType: 'dink', title: 'Left-handed · bright indoor', detail: 'Full body at kitchen line', expectedGate: 'usable' },
  { id: 'D03', practiceType: 'dink', title: 'Lower legs deliberately cropped', detail: 'Expect full-body retake', expectedGate: 'retake' },
  { id: 'R01', practiceType: 'drive', title: 'Right-handed · outdoor', detail: 'Full body · rear 45°', expectedGate: 'usable' },
  { id: 'R02', practiceType: 'drive', title: 'Left-handed · bright indoor', detail: 'Full body · rear 45°', expectedGate: 'usable' },
  { id: 'R03', practiceType: 'drive', title: 'Fast swing in uneven light', detail: 'Evidence decides', expectedGate: 'evidence-decides' },
] as const satisfies readonly PoseBenchmarkCase[];

export type PoseBenchmarkCaseId = (typeof poseBenchmarkCases)[number]['id'];

export function isPoseBenchmarkCaseId(value: unknown): value is PoseBenchmarkCaseId {
  return typeof value === 'string' && poseBenchmarkCases.some((item) => item.id === value);
}

export function getPoseBenchmarkCase(caseId: PoseBenchmarkCaseId) {
  return poseBenchmarkCases.find((item) => item.id === caseId)!;
}

export function getPoseBenchmarkCasesForPractice(practiceType: PracticeType) {
  return poseBenchmarkCases.filter((item) => item.practiceType === practiceType);
}
