import { isPracticeType, PracticeType } from '@/src/domain/practice';
import {
  getPoseBenchmarkCase,
  isPoseBenchmarkCaseId,
  PoseBenchmarkCaseId,
  PoseBenchmarkExpectation,
  poseBenchmarkCases,
} from '@/src/domain/poseBenchmarkProtocol';
import {
  calculateKeyJointCoverage,
  poseKeyJointNames,
  PoseExtractionResult,
  PoseKeyJointName,
  PoseQualityIssue,
} from '@/src/domain/poseTracking';

export type PoseBenchmarkVisualIssue =
  | 'limb-swap'
  | 'skeleton-jump'
  | 'missing-critical-joints'
  | 'wrong-person'
  | 'timing-drift'
  | 'other';

export type PoseBenchmarkVisualReview = 'pending' | 'clean' | 'needs-review';

export type PoseBenchmarkDevice = {
  modelName: string;
  osName: string;
  osVersion: string;
  isPhysicalDevice: boolean;
};

export type PoseBenchmarkRun = {
  id: string;
  clipFingerprint: string;
  practiceType: PracticeType;
  analyzedAt: string;
  status: 'usable' | 'retake';
  issues: PoseQualityIssue[];
  sourceVersion: string;
  runtimeMilliseconds: number;
  videoDuration: number;
  videoWidth: number;
  videoHeight: number;
  sampledFrameCount: number;
  poseCoverage: number;
  keyJointCoverage: number;
  keyJointCoverageByJoint?: Record<PoseKeyJointName, number>;
  averageConfidence: number;
  averageSubjectHeight: number;
  benchmarkCaseId?: PoseBenchmarkCaseId;
  expectedGate?: PoseBenchmarkExpectation;
  device?: PoseBenchmarkDevice;
  visualReview?: PoseBenchmarkVisualReview;
  visualIssues?: PoseBenchmarkVisualIssue[];
};

export type BenchmarkComparison = {
  decisionStable: boolean;
  poseCoverageDelta: number;
  keyJointCoverageDelta: number;
  runtimeDeltaMilliseconds: number;
};

export type PoseBenchmarkCaseQualificationIssue =
  | 'physical-device-required'
  | 'visual-review-pending'
  | 'visual-issue-flagged'
  | 'gate-mismatch'
  | 'exact-source-required';

export type PoseBenchmarkCaseAssessment = {
  caseId: PoseBenchmarkCaseId;
  status: 'pending' | 'qualified' | 'needs-review';
  issues: PoseBenchmarkCaseQualificationIssue[];
};

export type PoseBenchmarkCoverage = {
  assessments: PoseBenchmarkCaseAssessment[];
  qualifiedCaseCount: number;
  needsReviewCaseCount: number;
  physicalRunCount: number;
  visuallyReviewedPhysicalRunCount: number;
};

const poseQualityIssues = new Set<PoseQualityIssue>([
  'processing-failed',
  'insufficient-frames',
  'person-not-found',
  'multiple-people',
  'tracking-lost',
  'body-not-fully-visible',
  'subject-too-small',
]);
const benchmarkVisualIssues = new Set<PoseBenchmarkVisualIssue>([
  'limb-swap',
  'skeleton-jump',
  'missing-critical-joints',
  'wrong-person',
  'timing-drift',
  'other',
]);
const benchmarkRunKeys = new Set([
  'id',
  'clipFingerprint',
  'practiceType',
  'analyzedAt',
  'status',
  'issues',
  'sourceVersion',
  'runtimeMilliseconds',
  'videoDuration',
  'videoWidth',
  'videoHeight',
  'sampledFrameCount',
  'poseCoverage',
  'keyJointCoverage',
  'keyJointCoverageByJoint',
  'averageConfidence',
  'averageSubjectHeight',
  'benchmarkCaseId',
  'expectedGate',
  'device',
  'visualReview',
  'visualIssues',
]);

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isUnitNumber(value: unknown): value is number {
  return isFiniteNonNegative(value) && value <= 1;
}

function isBoundedLabel(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 80;
}

function isBoundedIdentifier(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 120;
}

function isPoseBenchmarkDevice(value: unknown): value is PoseBenchmarkDevice {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<PoseBenchmarkDevice>;
  return (
    Object.keys(value).every((key) => ['modelName', 'osName', 'osVersion', 'isPhysicalDevice'].includes(key)) &&
    isBoundedLabel(candidate.modelName) &&
    isBoundedLabel(candidate.osName) &&
    isBoundedLabel(candidate.osVersion) &&
    typeof candidate.isPhysicalDevice === 'boolean'
  );
}

function isKeyJointCoverageMap(
  value: unknown,
): value is Record<PoseKeyJointName, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  const expectedNames = new Set<string>(poseKeyJointNames);
  return (
    entries.length === poseKeyJointNames.length &&
    entries.every(([name, coverage]) => expectedNames.has(name) && isUnitNumber(coverage))
  );
}

function hashFingerprint(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function createClipFingerprint(input: {
  assetId?: string | null;
  fileName?: string | null;
  fileSize?: number;
  duration?: number | null;
  width: number;
  height: number;
}) {
  return `clip-${hashFingerprint(JSON.stringify([
    input.assetId ?? '',
    input.fileName ?? '',
    input.fileSize ?? 0,
    input.duration ?? 0,
    input.width,
    input.height,
  ]))}`;
}

export function createRecordedSessionClipFingerprint(input: {
  id: string;
  recordedAt: string;
  duration: number;
}) {
  return `clip-${hashFingerprint(JSON.stringify([
    'guided-camera-session',
    input.id,
    input.recordedAt,
    input.duration,
  ]))}`;
}

export function toPoseBenchmarkRouteParams(
  session: { id: string },
  benchmarkCaseId: PoseBenchmarkCaseId,
) {
  return { benchmarkCaseId, sessionId: session.id };
}

export function benchmarkRunFromResult({
  benchmarkCaseId,
  clipFingerprint,
  device,
  practiceType,
  result,
  runtimeMilliseconds,
}: {
  benchmarkCaseId?: PoseBenchmarkCaseId;
  clipFingerprint: string;
  device?: PoseBenchmarkDevice;
  practiceType: PracticeType;
  result: PoseExtractionResult;
  runtimeMilliseconds: number;
}): PoseBenchmarkRun {
  const benchmarkCase = benchmarkCaseId ? getPoseBenchmarkCase(benchmarkCaseId) : null;
  if (benchmarkCase && benchmarkCase.practiceType !== practiceType) {
    throw new Error('The benchmark case does not match the selected practice type.');
  }

  return {
    id: `benchmark-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    clipFingerprint,
    practiceType,
    analyzedAt: new Date().toISOString(),
    status: result.quality.status,
    issues: result.quality.issues,
    sourceVersion: result.sourceVersion,
    runtimeMilliseconds: Math.max(0, Math.round(runtimeMilliseconds)),
    videoDuration: result.video.duration,
    videoWidth: result.video.width,
    videoHeight: result.video.height,
    sampledFrameCount: result.sampling.sampledFrameCount,
    poseCoverage: result.quality.poseCoverage,
    keyJointCoverage: result.quality.keyJointCoverage,
    keyJointCoverageByJoint: Object.fromEntries(
      calculateKeyJointCoverage(result.frames).map(({ joint, coverage }) => [joint, coverage]),
    ) as Record<PoseKeyJointName, number>,
    averageConfidence: result.quality.averageConfidence,
    averageSubjectHeight: result.quality.averageSubjectHeight,
    ...(benchmarkCase ? {
      benchmarkCaseId: benchmarkCase.id,
      expectedGate: benchmarkCase.expectedGate,
      visualReview: 'pending' as const,
      visualIssues: [],
    } : {}),
    ...(device ? { device } : {}),
  };
}

export function withBenchmarkVisualReview(
  run: PoseBenchmarkRun,
  visualReview: Exclude<PoseBenchmarkVisualReview, 'pending'>,
  visualIssues: PoseBenchmarkVisualIssue[] = [],
) {
  const normalizedIssues = [...new Set(visualIssues)];
  if (visualReview === 'needs-review' && normalizedIssues.length === 0) {
    throw new Error('Choose at least one visible tracking issue.');
  }
  if (!normalizedIssues.every((issue) => benchmarkVisualIssues.has(issue))) {
    throw new Error('The visual review contains an unsupported issue.');
  }
  return {
    ...run,
    visualReview,
    visualIssues: visualReview === 'clean' ? [] : normalizedIssues,
  } satisfies PoseBenchmarkRun;
}

function isPhysicalRun(run: PoseBenchmarkRun) {
  return run.device?.isPhysicalDevice === true;
}

function hasExpectedGate(run: PoseBenchmarkRun) {
  return run.expectedGate === 'evidence-decides' || run.status === run.expectedGate;
}

function hasMatchingServeBaseline(run: PoseBenchmarkRun, runs: PoseBenchmarkRun[]) {
  if (run.benchmarkCaseId !== 'S02') return true;
  return runs.some((baseline) => (
    baseline.benchmarkCaseId === 'S01' &&
    baseline.clipFingerprint === run.clipFingerprint &&
    baseline.sourceVersion === run.sourceVersion &&
    baseline.status === run.status &&
    isPhysicalRun(baseline) &&
    baseline.visualReview === 'clean' &&
    hasExpectedGate(baseline)
  ));
}

export function isPoseBenchmarkRunQualified(
  run: PoseBenchmarkRun,
  runs: PoseBenchmarkRun[],
) {
  return Boolean(
    run.benchmarkCaseId &&
    isPhysicalRun(run) &&
    run.visualReview === 'clean' &&
    hasExpectedGate(run) &&
    hasMatchingServeBaseline(run, runs)
  );
}

/**
 * A benchmark case counts only when a physical iPhone produced the expected
 * gate, a person watched the complete overlay and marked it clean, and the
 * S02 repeatability case really reused S01's exact source clip and model.
 */
export function assessPoseBenchmarkCase(
  caseId: PoseBenchmarkCaseId,
  runs: PoseBenchmarkRun[],
): PoseBenchmarkCaseAssessment {
  const caseRuns = runs.filter((run) => run.benchmarkCaseId === caseId);
  if (caseRuns.length === 0) {
    return { caseId, status: 'pending', issues: [] };
  }

  const physicalRuns = caseRuns.filter(isPhysicalRun);
  const qualified = physicalRuns.some((run) => isPoseBenchmarkRunQualified(run, runs));
  if (qualified) {
    return { caseId, status: 'qualified', issues: [] };
  }

  const issues = new Set<PoseBenchmarkCaseQualificationIssue>();
  if (physicalRuns.length === 0) {
    issues.add('physical-device-required');
  }
  for (const run of physicalRuns) {
    if (run.visualReview === 'needs-review') issues.add('visual-issue-flagged');
    if (run.visualReview !== 'clean' && run.visualReview !== 'needs-review') {
      issues.add('visual-review-pending');
    }
    if (!hasExpectedGate(run)) issues.add('gate-mismatch');
    if (
      run.visualReview === 'clean' &&
      hasExpectedGate(run) &&
      !hasMatchingServeBaseline(run, runs)
    ) {
      issues.add('exact-source-required');
    }
  }

  return { caseId, status: 'needs-review', issues: [...issues] };
}

export function getPoseBenchmarkCoverage(runs: PoseBenchmarkRun[]): PoseBenchmarkCoverage {
  const assessments = poseBenchmarkCases.map((item) => assessPoseBenchmarkCase(item.id, runs));
  const physicalRuns = runs.filter(isPhysicalRun);
  return {
    assessments,
    qualifiedCaseCount: assessments.filter((item) => item.status === 'qualified').length,
    needsReviewCaseCount: assessments.filter((item) => item.status === 'needs-review').length,
    physicalRunCount: physicalRuns.length,
    visuallyReviewedPhysicalRunCount: physicalRuns.filter(
      (run) => run.visualReview === 'clean' || run.visualReview === 'needs-review',
    ).length,
  };
}

export function getNextUnqualifiedPoseBenchmarkCase(
  runs: PoseBenchmarkRun[],
  afterCaseId?: PoseBenchmarkCaseId,
) {
  const assessments = getPoseBenchmarkCoverage(runs).assessments;
  const startIndex = afterCaseId
    ? Math.max(0, poseBenchmarkCases.findIndex((item) => item.id === afterCaseId) + 1)
    : 0;
  const orderedAssessments = [
    ...assessments.slice(startIndex),
    ...assessments.slice(0, startIndex),
  ];
  const nextAssessment = orderedAssessments.find((item) => item.status !== 'qualified');
  return nextAssessment
    ? getPoseBenchmarkCase(nextAssessment.caseId)
    : null;
}

export function getLatestPoseBenchmarkRunForCase(
  caseId: PoseBenchmarkCaseId,
  runs: PoseBenchmarkRun[],
) {
  let latestRun: PoseBenchmarkRun | null = null;
  for (const run of runs) {
    if (run.benchmarkCaseId !== caseId) continue;
    if (!latestRun || Date.parse(run.analyzedAt) > Date.parse(latestRun.analyzedAt)) {
      latestRun = run;
    }
  }
  return latestRun;
}

export function shouldConfirmPoseBenchmarkClipDiscard(
  run: PoseBenchmarkRun | null,
  hasClip: boolean,
) {
  return hasClip && run?.visualReview === 'pending';
}

export function buildPoseBenchmarkReport(
  runs: PoseBenchmarkRun[],
  generatedAt: Date = new Date(),
) {
  const coverage = getPoseBenchmarkCoverage(runs);
  const reviewedPhysicalRuns = runs.filter((run) => (
    isPhysicalRun(run) &&
    (run.visualReview === 'clean' || run.visualReview === 'needs-review')
  ));
  const flaggedPhysicalRuns = reviewedPhysicalRuns.filter(
    (run) => run.visualReview === 'needs-review',
  );
  const lines = runs.map((run) => {
    const device = run.device
      ? `${run.device.modelName} / ${run.device.osName} ${run.device.osVersion}`
      : 'device unavailable';
    const review = run.visualReview === 'needs-review'
      ? `flagged:${run.visualIssues?.join('+') || 'other'}`
      : run.visualReview ?? 'legacy';
    const weakestJoints = run.keyJointCoverageByJoint
      ? [...poseKeyJointNames]
          .sort((left, right) => (
            run.keyJointCoverageByJoint![left] - run.keyJointCoverageByJoint![right]
          ))
          .slice(0, 3)
          .map((joint) => `${joint}:${Math.round(run.keyJointCoverageByJoint![joint] * 100)}%`)
          .join('+')
      : 'unavailable';
    return [
      run.benchmarkCaseId ?? 'UNASSIGNED',
      run.practiceType,
      run.clipFingerprint,
      run.status,
      review,
      `body=${Math.round(run.poseCoverage * 100)}%`,
      `joints=${Math.round(run.keyJointCoverage * 100)}%`,
      `weakest=${weakestJoints}`,
      `confidence=${Math.round(run.averageConfidence * 100)}%`,
      `runtime=${run.runtimeMilliseconds}ms`,
      device,
      run.sourceVersion,
    ].join(' | ');
  });

  return [
    'PickleCoach pose benchmark report',
    `Generated: ${generatedAt.toISOString()}`,
    `Cases qualified: ${coverage.qualifiedCaseCount}/${poseBenchmarkCases.length} · ${coverage.needsReviewCaseCount} need review`,
    `Runs: ${runs.length} total · ${coverage.physicalRunCount} physical · ${coverage.visuallyReviewedPhysicalRunCount} physically reviewed · ${flaggedPhysicalRuns.length} physically flagged`,
    'Privacy: aggregate metrics only; no video URI or landmark frames.',
    '',
    ...lines,
  ].join('\n');
}

export function compareBenchmarkRuns(
  current: PoseBenchmarkRun,
  previous: PoseBenchmarkRun,
): BenchmarkComparison {
  return {
    decisionStable: current.status === previous.status,
    poseCoverageDelta: current.poseCoverage - previous.poseCoverage,
    keyJointCoverageDelta: current.keyJointCoverage - previous.keyJointCoverage,
    runtimeDeltaMilliseconds: current.runtimeMilliseconds - previous.runtimeMilliseconds,
  };
}

export function isPoseBenchmarkRun(value: unknown): value is PoseBenchmarkRun {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<PoseBenchmarkRun>;
  const benchmarkCase = isPoseBenchmarkCaseId(candidate.benchmarkCaseId)
    ? getPoseBenchmarkCase(candidate.benchmarkCaseId)
    : null;
  const hasValidCaseMetadata = candidate.benchmarkCaseId === undefined
    ? candidate.expectedGate === undefined
    : Boolean(
      benchmarkCase &&
      benchmarkCase.practiceType === candidate.practiceType &&
      candidate.expectedGate === benchmarkCase.expectedGate,
    );
  const hasValidReview = candidate.visualReview === undefined
    ? candidate.visualIssues === undefined
    : (
      (candidate.visualReview === 'pending' || candidate.visualReview === 'clean' || candidate.visualReview === 'needs-review') &&
      Array.isArray(candidate.visualIssues) &&
      candidate.visualIssues.every((issue) => benchmarkVisualIssues.has(issue)) &&
      (candidate.visualReview === 'needs-review' ? candidate.visualIssues.length > 0 : candidate.visualIssues.length === 0)
    );
  return (
    Object.keys(value).every((key) => benchmarkRunKeys.has(key)) &&
    isBoundedIdentifier(candidate.id) &&
    typeof candidate.clipFingerprint === 'string' &&
    /^clip-[a-f0-9]{8}$/.test(candidate.clipFingerprint) &&
    isPracticeType(candidate.practiceType) &&
    typeof candidate.analyzedAt === 'string' &&
    Number.isFinite(Date.parse(candidate.analyzedAt)) &&
    (candidate.status === 'usable' || candidate.status === 'retake') &&
    Array.isArray(candidate.issues) &&
    candidate.issues.every((issue) => poseQualityIssues.has(issue)) &&
    isBoundedLabel(candidate.sourceVersion) &&
    isFiniteNonNegative(candidate.runtimeMilliseconds) &&
    isFiniteNonNegative(candidate.videoDuration) &&
    typeof candidate.videoWidth === 'number' && candidate.videoWidth > 0 &&
    typeof candidate.videoHeight === 'number' && candidate.videoHeight > 0 &&
    Number.isInteger(candidate.sampledFrameCount) && Number(candidate.sampledFrameCount) >= 0 &&
    isUnitNumber(candidate.poseCoverage) &&
    isUnitNumber(candidate.keyJointCoverage) &&
    (candidate.keyJointCoverageByJoint === undefined ||
      isKeyJointCoverageMap(candidate.keyJointCoverageByJoint)) &&
    isUnitNumber(candidate.averageConfidence) &&
    isUnitNumber(candidate.averageSubjectHeight) &&
    hasValidCaseMetadata &&
    (candidate.device === undefined || isPoseBenchmarkDevice(candidate.device)) &&
    hasValidReview
  );
}
