import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createRecordedPracticeSession,
  isRecordingDurationLongEnough,
  MAX_RECORDING_DURATION_SECONDS,
  MAX_RECORDING_FILE_SIZE_BYTES,
  MIN_RECORDING_DURATION_SECONDS,
  RECORDING_COUNTDOWN_SECONDS,
  RECORDING_VIDEO_ASPECT_RATIO,
  RECORDING_VIDEO_QUALITY,
  toAnalysisRouteParams,
} from '../src/domain/recordedPracticeSession.ts';

test('clamps recording duration and preserves capture provenance', () => {
  const session = createRecordedPracticeSession({
    practiceType: 'dink',
    videoUri: 'file:///private/tmp/practice.mov',
    duration: MAX_RECORDING_DURATION_SECONDS + 12,
  });

  assert.equal(session.practiceType, 'dink');
  assert.equal(session.duration, MAX_RECORDING_DURATION_SECONDS);
  assert.equal(session.captureMetadata.audioCaptured, false);
  assert.equal(session.captureMetadata.cameraFacing, 'back');
  assert.equal(session.captureMetadata.orientation, 'portrait');
  assert.equal(session.captureMetadata.maxFileSizeBytes, MAX_RECORDING_FILE_SIZE_BYTES);
  assert.equal(session.captureMetadata.maxDuration, MAX_RECORDING_DURATION_SECONDS);
  assert.equal(session.captureMetadata.videoQuality, RECORDING_VIDEO_QUALITY);
});

test('requires enough captured motion before analysis', () => {
  assert.equal(RECORDING_COUNTDOWN_SECONDS, 5);
  assert.equal(MIN_RECORDING_DURATION_SECONDS, 5);
  assert.equal(isRecordingDurationLongEnough(4.99), false);
  assert.equal(isRecordingDurationLongEnough(5), true);
  assert.equal(isRecordingDurationLongEnough(Number.NaN), false);
});

test('defines the contained portrait frame used by capture and playback', () => {
  assert.equal(RECORDING_VIDEO_QUALITY, '720p');
  assert.equal(RECORDING_VIDEO_ASPECT_RATIO, 9 / 16);
});

test('keeps raw video details out of analysis navigation state', () => {
  const session = createRecordedPracticeSession({
    practiceType: 'serve',
    videoUri: 'file:///private/secret-player-video.mov',
    duration: 8.2,
  });

  const params = toAnalysisRouteParams(session);
  assert.deepEqual(params, { sessionId: session.id, shot: 'serve' });
  assert.doesNotMatch(JSON.stringify(params), /video|private|recordedAt|duration/i);
});
