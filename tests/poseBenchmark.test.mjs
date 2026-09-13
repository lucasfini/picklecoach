import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assessPoseBenchmarkCase,
  buildPoseBenchmarkReport,
  compareBenchmarkRuns,
  createClipFingerprint,
  createRecordedSessionClipFingerprint,
  getLatestPoseBenchmarkRunForCase,
  getNextUnqualifiedPoseBenchmarkCase,
  getPoseBenchmarkCoverage,
  isPoseBenchmarkRun,
  isPoseBenchmarkRunQualified,
  shouldConfirmPoseBenchmarkClipDiscard,
  toPoseBenchmarkRouteParams,
  withBenchmarkVisualReview,
} from '../src/domain/poseBenchmark.ts';

function benchmarkRun(overrides = {}) {
  return {
    id: 'benchmark-1',
    clipFingerprint: 'clip-1234abcd',
    practiceType: 'serve',
    analyzedAt: '2026-09-12T20:00:00Z',
    status: 'usable',
    issues: [],
    sourceVersion: 'VNDetectHumanBodyPoseRequest-revision-1',
    runtimeMilliseconds: 820,
    videoDuration: 6.2,
    videoWidth: 1080,
    videoHeight: 1920,
    sampledFrameCount: 50,
    poseCoverage: 0.92,
    keyJointCoverage: 0.86,
    keyJointCoverageByJoint: {
      leftShoulder: 0.96,
      rightShoulder: 0.96,
      leftElbow: 0.9,
      rightElbow: 0.91,
      leftWrist: 0.6,
      rightWrist: 0.82,
      leftHip: 0.94,
      rightHip: 0.94,
      leftKnee: 0.88,
      rightKnee: 0.87,
      leftAnkle: 0.75,
      rightAnkle: 0.72,
    },
    averageConfidence: 0.88,
    averageSubjectHeight: 0.64,
    ...overrides,
  };
}

test('creates a stable opaque clip fingerprint without exposing the filename', () => {
  const metadata = {
    assetId: 'A1',
    fileName: 'lucas-private-serve.mov',
    fileSize: 4_200_000,
    duration: 6200,
    width: 1080,
    height: 1920,
  };
  const first = createClipFingerprint(metadata);
  const second = createClipFingerprint(metadata);

  assert.equal(first, second);
  assert.match(first, /^clip-[a-f0-9]{8}$/);
  assert.ok(!first.includes('lucas'));
  assert.notEqual(first, createClipFingerprint({ ...metadata, fileSize: 4_200_001 }));

  const sessionFingerprint = createRecordedSessionClipFingerprint({
    id: 'practice-private-session-id',
    recordedAt: '2026-09-13T12:00:00Z',
    duration: 8.4,
  });
  assert.match(sessionFingerprint, /^clip-[a-f0-9]{8}$/);
  assert.ok(!sessionFingerprint.includes('private'));
  assert.equal(
    sessionFingerprint,
    createRecordedSessionClipFingerprint({
      id: 'practice-private-session-id',
      recordedAt: '2026-09-13T12:00:00Z',
      duration: 8.4,
    }),
  );

  const routeParams = toPoseBenchmarkRouteParams(
    { id: 'practice-session-with-private-video-in-memory' },
    'S01',
  );
  assert.deepEqual(routeParams, {
    benchmarkCaseId: 'S01',
    sessionId: 'practice-session-with-private-video-in-memory',
  });
  assert.doesNotMatch(JSON.stringify(routeParams), /file:|\.mov|videoUri/);
});

test('accepts only compact benchmark summaries and rejects retained video data', () => {
  assert.equal(isPoseBenchmarkRun(benchmarkRun()), true);
  assert.equal(isPoseBenchmarkRun(benchmarkRun({ videoUri: 'file:///private/video.mov' })), false);
  assert.equal(isPoseBenchmarkRun(benchmarkRun({ frames: [{ timestamp: 0 }] })), false);
  assert.equal(isPoseBenchmarkRun(benchmarkRun({ poseCoverage: 1.1 })), false);
  assert.equal(isPoseBenchmarkRun(benchmarkRun({ issues: ['invented-issue'] })), false);
  assert.equal(isPoseBenchmarkRun(benchmarkRun({ clipFingerprint: 'clip-private-video-name' })), false);
  assert.equal(isPoseBenchmarkRun(benchmarkRun({ sourceVersion: 'x'.repeat(81) })), false);
  assert.equal(isPoseBenchmarkRun(benchmarkRun({ keyJointCoverageByJoint: { leftWrist: 0.8 } })), false);
  assert.equal(isPoseBenchmarkRun(benchmarkRun({
    keyJointCoverageByJoint: {
      ...benchmarkRun().keyJointCoverageByJoint,
      inventedJoint: 0.8,
    },
  })), false);
  const legacyRun = benchmarkRun();
  delete legacyRun.keyJointCoverageByJoint;
  assert.equal(isPoseBenchmarkRun(legacyRun), true);
});

test('validates benchmark case, device, and human-review provenance', () => {
  const reviewedRun = benchmarkRun({
    benchmarkCaseId: 'S01',
    expectedGate: 'usable',
    device: {
      modelName: 'iPhone 15 Pro',
      osName: 'iOS',
      osVersion: '26.0',
      isPhysicalDevice: true,
    },
    visualReview: 'clean',
    visualIssues: [],
  });

  assert.equal(isPoseBenchmarkRun(reviewedRun), true);
  assert.equal(isPoseBenchmarkRun({ ...reviewedRun, expectedGate: 'retake' }), false);
  assert.equal(isPoseBenchmarkRun({ ...reviewedRun, practiceType: 'dink' }), false);
  assert.equal(isPoseBenchmarkRun({ ...reviewedRun, videoUri: 'file:///private/serve.mov' }), false);
  assert.equal(isPoseBenchmarkRun({ ...reviewedRun, visualReview: 'needs-review' }), false);
  assert.equal(isPoseBenchmarkRun({
    ...reviewedRun,
    visualReview: 'needs-review',
    visualIssues: ['limb-swap'],
  }), true);
});

test('requires an explicit issue for a flagged visual review', () => {
  assert.throws(
    () => withBenchmarkVisualReview(benchmarkRun(), 'needs-review', []),
    /at least one visible tracking issue/,
  );
  const flagged = withBenchmarkVisualReview(benchmarkRun(), 'needs-review', ['limb-swap', 'limb-swap']);
  assert.deepEqual(flagged.visualIssues, ['limb-swap']);
  assert.equal(flagged.visualReview, 'needs-review');

  const clean = withBenchmarkVisualReview(flagged, 'clean');
  assert.equal(clean.visualReview, 'clean');
  assert.deepEqual(clean.visualIssues, []);
});

test('exports a privacy-bounded benchmark report', () => {
  const report = buildPoseBenchmarkReport([
    benchmarkRun({
      benchmarkCaseId: 'S01',
      expectedGate: 'usable',
      visualReview: 'clean',
      visualIssues: [],
      device: {
        modelName: 'iPhone 15 Pro',
        osName: 'iOS',
        osVersion: '26.0',
        isPhysicalDevice: true,
      },
    }),
  ], new Date('2026-09-13T12:00:00Z'));

  assert.match(report, /Cases qualified: 1\/16/);
  assert.match(report, /1 physical/);
  assert.match(report, /0 physically flagged/);
  assert.match(report, /S01 \| serve \| clip-1234abcd \| usable \| clean/);
  assert.match(report, /weakest=leftWrist:60%\+rightAnkle:72%\+leftAnkle:75%/);
  assert.match(report, /iPhone 15 Pro \/ iOS 26.0/);
  assert.ok(!report.includes('file:///'));
  assert.ok(!report.includes('frames:'));
});

test('qualifies only clean physical evidence with the expected gate and exact rerun source', () => {
  const device = {
    modelName: 'iPhone 15 Pro',
    osName: 'iOS',
    osVersion: '26.0',
    isPhysicalDevice: true,
  };
  const s01 = benchmarkRun({
    benchmarkCaseId: 'S01',
    expectedGate: 'usable',
    device,
    visualReview: 'clean',
    visualIssues: [],
  });
  const simulatorAttempt = { ...s01, id: 'simulator', device: { ...device, isPhysicalDevice: false } };
  assert.equal(assessPoseBenchmarkCase('S01', [simulatorAttempt]).status, 'needs-review');
  assert.deepEqual(
    assessPoseBenchmarkCase('S01', [simulatorAttempt]).issues,
    ['physical-device-required'],
  );

  const mismatch = {
    ...s01,
    id: 'mismatch',
    status: 'retake',
    issues: ['tracking-lost'],
  };
  assert.deepEqual(assessPoseBenchmarkCase('S01', [mismatch]).issues, ['gate-mismatch']);
  assert.equal(assessPoseBenchmarkCase('S01', [s01]).status, 'qualified');

  const wrongSourceRerun = {
    ...s01,
    id: 'benchmark-s02-wrong',
    benchmarkCaseId: 'S02',
    clipFingerprint: 'clip-deadbeef',
  };
  assert.deepEqual(
    assessPoseBenchmarkCase('S02', [wrongSourceRerun, s01]).issues,
    ['exact-source-required'],
  );

  const exactRerun = {
    ...wrongSourceRerun,
    id: 'benchmark-s02-exact',
    clipFingerprint: s01.clipFingerprint,
  };
  const coverage = getPoseBenchmarkCoverage([exactRerun, s01]);
  assert.equal(assessPoseBenchmarkCase('S02', [exactRerun, s01]).status, 'qualified');
  assert.equal(coverage.qualifiedCaseCount, 2);
  assert.equal(coverage.physicalRunCount, 2);
  assert.equal(coverage.visuallyReviewedPhysicalRunCount, 2);
  assert.equal(getNextUnqualifiedPoseBenchmarkCase([exactRerun, s01])?.id, 'S03');
});

test('requires the current run itself to qualify before offering an exact-source rerun', () => {
  const device = {
    modelName: 'iPhone 15 Pro',
    osName: 'iOS',
    osVersion: '26.0',
    isPhysicalDevice: true,
  };
  const qualifiedS01 = benchmarkRun({
    benchmarkCaseId: 'S01',
    expectedGate: 'usable',
    device,
    visualReview: 'clean',
    visualIssues: [],
  });
  const pendingCurrentS01 = {
    ...qualifiedS01,
    id: 'benchmark-current-s01',
    clipFingerprint: 'clip-feedbeef',
    visualReview: 'pending',
  };

  assert.equal(
    assessPoseBenchmarkCase('S01', [pendingCurrentS01, qualifiedS01]).status,
    'qualified',
  );
  assert.equal(
    isPoseBenchmarkRunQualified(pendingCurrentS01, [pendingCurrentS01, qualifiedS01]),
    false,
  );
  assert.equal(
    isPoseBenchmarkRunQualified(qualifiedS01, [pendingCurrentS01, qualifiedS01]),
    true,
  );

  const exactS02 = {
    ...qualifiedS01,
    id: 'benchmark-exact-s02',
    benchmarkCaseId: 'S02',
  };
  const wrongSourceS02 = {
    ...exactS02,
    id: 'benchmark-wrong-s02',
    clipFingerprint: pendingCurrentS01.clipFingerprint,
  };
  assert.equal(isPoseBenchmarkRunQualified(exactS02, [qualifiedS01, exactS02]), true);
  assert.equal(
    isPoseBenchmarkRunQualified(wrongSourceS02, [qualifiedS01, wrongSourceS02]),
    false,
  );
});

test('finds the latest saved evidence for a revisited benchmark case', () => {
  const olderS06 = benchmarkRun({
    id: 'older-s06',
    benchmarkCaseId: 'S06',
    expectedGate: 'retake',
    status: 'retake',
    analyzedAt: '2026-09-13T10:00:00Z',
  });
  const latestS06 = {
    ...olderS06,
    id: 'latest-s06',
    analyzedAt: '2026-09-13T12:00:00Z',
  };
  const laterOtherCase = benchmarkRun({
    id: 'later-s07',
    benchmarkCaseId: 'S07',
    expectedGate: 'retake',
    status: 'retake',
    analyzedAt: '2026-09-13T13:00:00Z',
  });

  assert.equal(
    getLatestPoseBenchmarkRunForCase('S06', [olderS06, laterOtherCase, latestS06])?.id,
    'latest-s06',
  );
  assert.equal(getLatestPoseBenchmarkRunForCase('S05', [latestS06, laterOtherCase]), null);
});

test('warns before a pending visual review loses its temporary clip', () => {
  const pendingRun = benchmarkRun({ visualReview: 'pending' });
  assert.equal(shouldConfirmPoseBenchmarkClipDiscard(pendingRun, true), true);
  assert.equal(shouldConfirmPoseBenchmarkClipDiscard(pendingRun, false), false);
  assert.equal(
    shouldConfirmPoseBenchmarkClipDiscard({ ...pendingRun, visualReview: 'clean' }, true),
    false,
  );
  assert.equal(shouldConfirmPoseBenchmarkClipDiscard(null, true), false);
});

test('compares repeat runs without turning deltas into coaching claims', () => {
  const previous = benchmarkRun();
  const current = benchmarkRun({
    id: 'benchmark-2',
    poseCoverage: 0.9,
    keyJointCoverage: 0.87,
    runtimeMilliseconds: 760,
  });
  const comparison = compareBenchmarkRuns(current, previous);

  assert.equal(comparison.decisionStable, true);
  assert.ok(Math.abs(comparison.poseCoverageDelta + 0.02) < 0.000001);
  assert.ok(Math.abs(comparison.keyJointCoverageDelta - 0.01) < 0.000001);
  assert.equal(comparison.runtimeDeltaMilliseconds, -60);

  assert.equal(
    compareBenchmarkRuns(benchmarkRun({ status: 'retake' }), previous).decisionStable,
    false,
  );
});
