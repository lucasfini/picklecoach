import assert from 'node:assert/strict';
import test from 'node:test';
import { practiceTypes } from '../src/domain/practice.ts';
import { demoAnalysisService } from '../src/services/analysisService.ts';

function session(practiceType) {
  return {
    id: `session-${practiceType}`,
    practiceType,
    videoUri: `file:///private/${practiceType}.mov`,
    recordedAt: '2026-09-13T12:00:00.000Z',
    duration: 10,
    captureMetadata: { cameraFacing: 'back', maxDuration: 30 },
  };
}

test('returns a distinct, explicitly demo coaching fixture for each MVP skill', async () => {
  const results = await Promise.all(
    practiceTypes.map((practiceType) => demoAnalysisService.analyze(session(practiceType))),
  );

  assert.equal(new Set(results.map((result) => result.drillTitle)).size, practiceTypes.length);
  for (const [index, result] of results.entries()) {
    assert.equal(result.source, 'demo');
    assert.equal(result.sessionId, `session-${practiceTypes[index]}`);
    assert.match(result.explanation, /^Example only:/);
    assert.equal(result.metrics.length, 5);
    assert.doesNotMatch(JSON.stringify(result), /file:\/\/|\.mov/);
  }
});
