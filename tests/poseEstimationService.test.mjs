import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PoseExtractionTimeoutError,
  withPoseExtractionDeadline,
} from '../src/services/poseExtractionDeadline.ts';

test('returns a pose operation that settles before its deadline', async () => {
  const result = await withPoseExtractionDeadline(Promise.resolve('landmarks'), 100);
  assert.equal(result, 'landmarks');
});

test('rejects a stalled pose operation with a distinct timeout error', async () => {
  await assert.rejects(
    withPoseExtractionDeadline(new Promise(() => undefined), 5),
    PoseExtractionTimeoutError,
  );
});
