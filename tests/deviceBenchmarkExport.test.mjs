import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseBenchmarkFileContents,
  parseDeviceArgument,
} from '../scripts/pull-ios-pose-benchmark.mjs';

const validRun = {
  id: 'benchmark-physical-1',
  clipFingerprint: 'clip-1234abcd',
  practiceType: 'serve',
  analyzedAt: '2026-09-13T12:00:00.000Z',
  status: 'usable',
  issues: [],
  sourceVersion: 'VNDetectHumanBodyPoseRequest-revision-1',
  runtimeMilliseconds: 1400,
  videoDuration: 8,
  videoWidth: 720,
  videoHeight: 1280,
  sampledFrameCount: 64,
  poseCoverage: 0.98,
  keyJointCoverage: 0.94,
  averageConfidence: 0.88,
  averageSubjectHeight: 0.72,
  benchmarkCaseId: 'S01',
  expectedGate: 'usable',
  device: {
    modelName: 'iPhone 14',
    osName: 'iOS',
    osVersion: '26.6.2',
    isPhysicalDevice: true,
  },
  visualReview: 'clean',
  visualIssues: [],
};

test('accepts one explicit device argument without invoking a shell', () => {
  assert.equal(parseDeviceArgument(['--device', 'Lucas Iphone']), 'Lucas Iphone');
  assert.equal(parseDeviceArgument(['--device', '  ']), null);
  assert.equal(parseDeviceArgument(['Lucas Iphone']), null);
  assert.equal(parseDeviceArgument(['--device', 'one', 'extra']), null);
});

test('validates every pulled benchmark record before reporting it', () => {
  assert.deepEqual(parseBenchmarkFileContents(JSON.stringify([validRun])), [validRun]);
  assert.throws(
    () => parseBenchmarkFileContents(JSON.stringify([{ ...validRun, videoUri: 'file:///private/clip.mov' }])),
    /invalid or unsafe record/,
  );
});

test('rejects empty and malformed device benchmark files', () => {
  assert.throws(() => parseBenchmarkFileContents('[]'), /No saved Pose Lab runs/);
  assert.throws(() => parseBenchmarkFileContents('{}'), /No saved Pose Lab runs/);
  assert.throws(() => parseBenchmarkFileContents('{'), SyntaxError);
});
