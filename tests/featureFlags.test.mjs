import assert from 'node:assert/strict';
import test from 'node:test';
import { resolvePoseLabAccess } from '../src/config/featureFlags.ts';

test('keeps Pose Lab development-only unless an internal build explicitly enables it', () => {
  assert.equal(resolvePoseLabAccess({ isDevelopment: true }), true);
  assert.equal(resolvePoseLabAccess({ explicitlyEnabled: '1', isDevelopment: false }), true);
  assert.equal(resolvePoseLabAccess({ explicitlyEnabled: '0', isDevelopment: false }), false);
  assert.equal(resolvePoseLabAccess({ explicitlyEnabled: 'true', isDevelopment: false }), false);
  assert.equal(resolvePoseLabAccess({ isDevelopment: false }), false);
});
