import assert from 'node:assert/strict';
import test from 'node:test';
import {
  activitiesInPracticeWeek,
  getPracticeWeekDays,
  isSameLocalDay,
  recommendNextPractice,
} from '../src/domain/practicePlan.ts';

function activity(practiceType, capturedAt) {
  return { practiceType, capturedAt: capturedAt.toISOString() };
}

test('builds a local seven-day practice week without date-string shortcuts', () => {
  const now = new Date(2026, 8, 16, 12, 0, 0);
  const days = getPracticeWeekDays(now);

  assert.equal(days.length, 7);
  assert.equal(days[0].getDay(), 0);
  assert.equal(days[6].getDay(), 6);
  assert.equal(isSameLocalDay(days[3], now), true);
  assert.equal(isSameLocalDay(days[2], now), false);
});

test('rotates the next practice among selected goals with no extra player input', () => {
  const now = new Date(2026, 8, 16, 12, 0, 0);
  const monday = new Date(2026, 8, 14, 10, 0, 0);
  const tuesday = new Date(2026, 8, 15, 10, 0, 0);
  const future = new Date(2026, 8, 17, 10, 0, 0);
  const priorWeek = new Date(2026, 8, 12, 10, 0, 0);

  assert.equal(recommendNextPractice(['serve'], [], now), 'serve');
  assert.equal(
    recommendNextPractice(
      ['serve', 'soft-game'],
      [activity('serve', monday)],
      now,
    ),
    'dink',
  );
  assert.equal(
    recommendNextPractice(
      ['consistency'],
      [activity('serve', monday), activity('dink', tuesday)],
      now,
    ),
    'drive',
  );

  const boundedWeek = activitiesInPracticeWeek([
    activity('serve', priorWeek),
    activity('dink', monday),
    activity('drive', future),
  ], now);
  assert.deepEqual(boundedWeek.map((item) => item.practiceType), ['dink']);
});
