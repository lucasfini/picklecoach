import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createPlayerProfile,
  isPlayerProfile,
} from '../src/domain/playerProfile.ts';
import {
  addPracticeActivity,
  isPracticeActivity,
  MAX_SAVED_PRACTICE_ACTIVITIES,
} from '../src/domain/practiceActivity.ts';

const existingProfile = {
  id: 'local-player',
  level: '3.0',
  goals: ['consistency'],
  weeklyTarget: 4,
  completedOnboardingAt: '2026-08-01T10:00:00.000Z',
};

test('profile edits preserve original onboarding provenance and weekly target', () => {
  const edited = createPlayerProfile(
    { level: '3.5', goals: ['serve', 'confidence'] },
    existingProfile,
  );

  assert.equal(edited.level, '3.5');
  assert.deepEqual(edited.goals, ['serve', 'confidence']);
  assert.equal(edited.weeklyTarget, 4);
  assert.equal(edited.completedOnboardingAt, existingProfile.completedOnboardingAt);
});

test('rejects malformed or over-broad local profiles', () => {
  assert.equal(isPlayerProfile(existingProfile), true);
  assert.equal(isPlayerProfile({ ...existingProfile, goals: ['serve', 'serve'] }), false);
  assert.equal(
    isPlayerProfile({ ...existingProfile, goals: ['serve', 'drives', 'confidence', 'soft-game'] }),
    false,
  );
  assert.equal(isPlayerProfile({ ...existingProfile, weeklyTarget: Number.POSITIVE_INFINITY }), false);
  assert.equal(isPlayerProfile({ ...existingProfile, weeklyTarget: 8 }), false);
  assert.equal(isPlayerProfile({ ...existingProfile, videoUri: 'file:///private/take.mov' }), false);
});

test('accepts only bounded completed-practice metadata', () => {
  const activity = {
    id: 'practice-1',
    practiceType: 'drive',
    capturedAt: '2026-09-13T12:00:00.000Z',
    duration: 14.2,
    analysisMode: 'demo',
  };

  assert.equal(isPracticeActivity(activity), true);
  assert.equal(isPracticeActivity({ ...activity, id: '  ' }), false);
  assert.equal(isPracticeActivity({ ...activity, duration: 0 }), false);
  assert.equal(isPracticeActivity({ ...activity, duration: 31 }), false);
  assert.equal(isPracticeActivity({ ...activity, analysisMode: 'measured' }), false);
  assert.equal(isPracticeActivity({ ...activity, videoUri: 'file:///private/take.mov' }), false);
  assert.equal(isPracticeActivity({ ...activity, id: 'x'.repeat(121) }), false);
});

test('deduplicates and caps local practice history deterministically', () => {
  const existing = Array.from({ length: MAX_SAVED_PRACTICE_ACTIVITIES }, (_, index) => ({
    id: `practice-${index}`,
    practiceType: 'serve',
    capturedAt: new Date(Date.UTC(2026, 8, 13, 12, index)).toISOString(),
    duration: 10,
    analysisMode: 'demo',
  }));
  const session = {
    id: 'practice-new',
    practiceType: 'drive',
    recordedAt: '2026-09-14T12:00:00.000Z',
    duration: 12,
  };

  const next = addPracticeActivity(existing, session);
  assert.equal(next.length, MAX_SAVED_PRACTICE_ACTIVITIES);
  assert.equal(next[0].id, 'practice-new');
  assert.equal(next.at(-1).id, 'practice-98');
  assert.equal(addPracticeActivity(next, session), next);
});
