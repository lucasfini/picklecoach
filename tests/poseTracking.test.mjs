import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateKeyJointCoverage,
  evaluatePoseTrackingQuality,
  formatPosePercentage,
  MAX_MULTIPLE_PERSON_FRAME_RATIO,
  nearestPoseFrame,
  parsePoseExtractionResult,
} from '../src/domain/poseTracking.ts';

const fullBodyLandmarks = {
  nose: { x: 0.5, y: 0.12, confidence: 0.96 },
  neck: { x: 0.5, y: 0.2, confidence: 0.95 },
  root: { x: 0.5, y: 0.57, confidence: 0.94 },
  leftShoulder: { x: 0.4, y: 0.24, confidence: 0.93 },
  rightShoulder: { x: 0.6, y: 0.24, confidence: 0.93 },
  leftElbow: { x: 0.33, y: 0.39, confidence: 0.91 },
  rightElbow: { x: 0.67, y: 0.39, confidence: 0.91 },
  leftWrist: { x: 0.28, y: 0.5, confidence: 0.89 },
  rightWrist: { x: 0.72, y: 0.5, confidence: 0.89 },
  leftHip: { x: 0.44, y: 0.57, confidence: 0.94 },
  rightHip: { x: 0.56, y: 0.57, confidence: 0.94 },
  leftKnee: { x: 0.43, y: 0.74, confidence: 0.9 },
  rightKnee: { x: 0.57, y: 0.74, confidence: 0.9 },
  leftAnkle: { x: 0.42, y: 0.92, confidence: 0.87 },
  rightAnkle: { x: 0.58, y: 0.92, confidence: 0.87 },
};

function detectedFrame(timestamp, landmarks = fullBodyLandmarks, personCount = 1) {
  return {
    timestamp,
    poseDetected: true,
    personCount,
    landmarks: structuredClone(landmarks),
  };
}

function emptyFrame(timestamp) {
  return { timestamp, poseDetected: false, personCount: 0, landmarks: {} };
}

function nativeResult(frames) {
  return {
    source: 'apple-vision-2d',
    sourceVersion: 'VNDetectHumanBodyPoseRequest-revision-1',
    processedAt: '2026-09-12T20:00:00Z',
    coordinateSpace: 'normalized-top-left-oriented-display',
    video: { duration: frames.at(-1)?.timestamp + 0.25 || 1, width: 1080, height: 1920 },
    sampling: {
      targetFramesPerSecond: 8,
      decodedFrameCount: frames.length * 4,
      sampledFrameCount: frames.length,
      maximumFrames: 240,
    },
    quality: evaluatePoseTrackingQuality(frames),
    frames,
  };
}

test('accepts a coherent native result and preserves provenance', () => {
  const frames = Array.from({ length: 6 }, (_, index) => detectedFrame(index / 8));
  const parsed = parsePoseExtractionResult(nativeResult(frames));

  assert.ok(parsed);
  assert.equal(parsed.source, 'apple-vision-2d');
  assert.equal(parsed.frames.length, 6);
  assert.equal(parsed.quality.status, 'usable');
  assert.deepEqual(parsed.quality.issues, []);
  assert.equal(parsed.quality.poseCoverage, 1);
  assert.equal(parsed.quality.keyJointCoverage, 1);
});

test('recomputes the quality gate from landmarks instead of trusting a usable flag', () => {
  const frames = [detectedFrame(0), detectedFrame(0.125), emptyFrame(0.25), emptyFrame(0.375), emptyFrame(0.5)];
  const forged = nativeResult(Array.from({ length: 5 }, (_, index) => detectedFrame(index / 8)));
  forged.frames = frames;
  forged.sampling.sampledFrameCount = frames.length;

  assert.equal(parsePoseExtractionResult(forged), null);
});

test('classifies the important retake conditions deterministically', () => {
  const missingPlayer = evaluatePoseTrackingQuality(Array.from({ length: 5 }, (_, index) => emptyFrame(index / 8)));
  assert.equal(missingPlayer.status, 'retake');
  assert.ok(missingPlayer.issues.includes('person-not-found'));
  assert.equal(missingPlayer.message, 'No full player was found. Step into frame and record again.');

  const smallLandmarks = Object.fromEntries(
    Object.entries(fullBodyLandmarks).map(([name, landmark]) => [
      name,
      { ...landmark, y: 0.45 + (landmark.y - 0.5) * 0.1 },
    ]),
  );
  const smallPlayer = evaluatePoseTrackingQuality(
    Array.from({ length: 5 }, (_, index) => detectedFrame(index / 8, smallLandmarks)),
  );
  assert.deepEqual(smallPlayer.issues, ['subject-too-small']);
  assert.match(smallPlayer.message, /Move the phone closer/);

  const lostTracking = evaluatePoseTrackingQuality([
    detectedFrame(0),
    detectedFrame(0.125),
    detectedFrame(0.25),
    emptyFrame(0.375),
    emptyFrame(0.5),
  ]);
  assert.ok(lostTracking.issues.includes('tracking-lost'));
  assert.equal(lostTracking.poseCoverage, 0.6);

  const processingFailure = evaluatePoseTrackingQuality(
    Array.from({ length: 5 }, (_, index) => ({
      ...emptyFrame(index / 8),
      frameError: 'vision-request-failed',
    })),
  );
  assert.ok(processingFailure.issues.includes('processing-failed'));
  assert.match(processingFailure.message, /could not process enough frames/);

  const crowdedFrames = Array.from({ length: 10 }, (_, index) => (
    detectedFrame(index / 8, fullBodyLandmarks, index < 2 ? 2 : 1)
  ));
  const multiplePeople = evaluatePoseTrackingQuality(crowdedFrames);
  assert.equal(MAX_MULTIPLE_PERSON_FRAME_RATIO, 0.1);
  assert.deepEqual(multiplePeople.issues, ['multiple-people']);
  assert.match(multiplePeople.message, /other players out of frame/);
});

test('rejects malformed, unbounded, and inconsistent native pose data', () => {
  const frames = Array.from({ length: 5 }, (_, index) => detectedFrame(index / 8));
  const invalidCoordinate = nativeResult(frames);
  invalidCoordinate.frames[0].landmarks.leftAnkle.x = 1.2;
  const coordinateSanitizedForQuality = structuredClone(invalidCoordinate.frames);
  delete coordinateSanitizedForQuality[0].landmarks.leftAnkle;
  invalidCoordinate.quality = evaluatePoseTrackingQuality(coordinateSanitizedForQuality);
  assert.equal(parsePoseExtractionResult(invalidCoordinate), null);

  const wrongCount = nativeResult(frames);
  wrongCount.sampling.sampledFrameCount = 4;
  assert.equal(parsePoseExtractionResult(wrongCount), null);

  const unordered = nativeResult(frames);
  unordered.frames[3].timestamp = 0.1;
  assert.equal(parsePoseExtractionResult(unordered), null);

  const oversizedSourceVersion = nativeResult(frames);
  oversizedSourceVersion.sourceVersion = 'v'.repeat(121);
  assert.equal(parsePoseExtractionResult(oversizedSourceVersion), null);

  const excessiveSampling = nativeResult(frames);
  excessiveSampling.sampling.maximumFrames = 361;
  assert.equal(parsePoseExtractionResult(excessiveSampling), null);

  const excessivePeople = nativeResult(frames);
  excessivePeople.frames[0].personCount = 33;
  excessivePeople.quality = evaluatePoseTrackingQuality(excessivePeople.frames);
  assert.equal(parsePoseExtractionResult(excessivePeople), null);

  const unsupportedFrameError = nativeResult(frames);
  unsupportedFrameError.frames[0].frameError = 'mystery-native-error';
  assert.equal(parsePoseExtractionResult(unsupportedFrameError), null);
});

test('selects the nearest synchronized frame at boundaries and between samples', () => {
  const frames = [detectedFrame(0), detectedFrame(0.5), detectedFrame(1)];

  assert.equal(nearestPoseFrame(frames, -1)?.timestamp, 0);
  assert.equal(nearestPoseFrame(frames, 0.26)?.timestamp, 0.5);
  assert.equal(nearestPoseFrame(frames, 0.75)?.timestamp, 0.5);
  assert.equal(nearestPoseFrame(frames, 2)?.timestamp, 1);
  assert.equal(nearestPoseFrame([], 0.5), null);
});

test('reports per-joint tracking coverage without treating it as technique', () => {
  const frames = [detectedFrame(0), detectedFrame(0.125)];
  delete frames[0].landmarks.leftWrist;
  delete frames[0].landmarks.rightAnkle;
  delete frames[1].landmarks.rightAnkle;

  const coverage = calculateKeyJointCoverage(frames);
  assert.deepEqual(
    coverage.find((item) => item.joint === 'leftWrist'),
    { joint: 'leftWrist', detectedFrameCount: 1, coverage: 0.5 },
  );
  assert.deepEqual(
    coverage.find((item) => item.joint === 'rightAnkle'),
    { joint: 'rightAnkle', detectedFrameCount: 0, coverage: 0 },
  );
  assert.ok(coverage.every((item) => !('score' in item)));
  assert.ok(calculateKeyJointCoverage([]).every((item) => item.coverage === 0));
});

test('formats quality ratios for compact UI labels', () => {
  assert.equal(formatPosePercentage(0), '0%');
  assert.equal(formatPosePercentage(0.734), '73%');
  assert.equal(formatPosePercentage(1), '100%');
});
