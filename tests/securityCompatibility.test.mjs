import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { performance } from 'node:perf_hooks';
import test from 'node:test';

const require = createRequire(import.meta.url);
const decodeUriComponent = require('decode-uri-component');
const queryString = require('query-string');

test('preserves Expo Router query-string compatibility after the decoder security backport', () => {
  assert.deepEqual(
    { ...queryString.parse('shot=serve&goal=more%20control&mark=%E2%9C%93') },
    { goal: 'more control', mark: '✓', shot: 'serve' },
  );
  assert.equal(decodeUriComponent('%C3'), '%C3');
});

test('handles long malformed percent input in linear time', () => {
  const malformedInput = '%C3'.repeat(25_000);
  const startedAt = performance.now();
  const decoded = decodeUriComponent(malformedInput);
  const elapsedMs = performance.now() - startedAt;

  assert.equal(decoded.length, malformedInput.length);
  assert.ok(elapsedMs < 1_000, `Malformed query decoding took ${elapsedMs.toFixed(1)} ms.`);
});
