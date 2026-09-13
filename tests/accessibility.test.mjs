import assert from 'node:assert/strict';
import test from 'node:test';
import { colors } from '../src/theme.ts';

function relativeLuminance(hexColor) {
  const channels = hexColor
    .slice(1)
    .match(/.{2}/g)
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) => channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4);
  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
}

function contrastRatio(first, second) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

test('keeps core small-text color pairs at WCAG AA contrast', () => {
  const pairs = [
    ['primary action', colors.ink, colors.primaryBright],
    ['dark green action', colors.white, colors.primary],
    ['body copy', colors.muted, colors.background],
    ['subtle copy', colors.subtle, colors.background],
    ['danger copy', colors.danger, colors.dangerSoft],
    ['warning copy', colors.warning, colors.warningSoft],
  ];

  for (const [label, foreground, background] of pairs) {
    assert.ok(
      contrastRatio(foreground, background) >= 4.5,
      `${label} must retain at least 4.5:1 contrast`,
    );
  }
});
