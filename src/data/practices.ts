import { PracticeType } from '@/src/domain/practice';

export type PracticeDefinition = {
  title: string;
  emoji: string;
  description: string;
  durationLabel: string;
  focusLabel: string;
  setup: {
    distance: string;
    angle: string;
    orientation: string;
    framing: string;
  };
  cameraSummary: string;
  cameraInstructions: string[];
};

export const practices: Record<PracticeType, PracticeDefinition> = {
  serve: {
    title: 'Serve',
    emoji: '🎯',
    description: 'Build a repeatable start to every point.',
    durationLabel: '5–10 min',
    focusLabel: 'Setup · contact · balance',
    setup: {
      distance: '10 ft away',
      angle: 'Rear 45° · paddle side',
      orientation: 'Portrait · waist high',
      framing: 'Full body + paddle',
    },
    cameraSummary: 'Rear 45° on your paddle side · 10 feet away · portrait at waist height.',
    cameraInstructions: [
      'Place the phone roughly 10 feet away.',
      "Frame the player's full body, paddle, and contact point.",
      'Record from 45° behind the player on their paddle side.',
      'Keep the phone upright in portrait at about waist height.',
      'Keep the phone stationary for all 5 serves.',
      'Choose a spot with enough light to see the full motion.',
    ],
  },
  dink: {
    title: 'Dink',
    emoji: '🏓',
    description: 'Make your soft game calmer and more reliable.',
    durationLabel: '5–10 min',
    focusLabel: 'Posture · contact · reset',
    setup: {
      distance: '8–10 ft away',
      angle: 'Sideline · side view',
      orientation: 'Portrait · waist high',
      framing: 'Body + kitchen line',
    },
    cameraSummary: 'Sideline side view · 8–10 feet away · portrait at waist height.',
    cameraInstructions: [
      'Place the phone 8–10 feet away near the sideline.',
      "Frame the player's full body and the kitchen line.",
      'Use a side angle that keeps paddle preparation visible.',
      'Keep the phone upright in portrait at about waist height.',
      'Keep the phone stationary for all 5 dinks.',
      'Avoid strong backlighting across the court.',
    ],
  },
  drive: {
    title: 'Drive',
    emoji: '⚡',
    description: 'Create controlled pace without forcing the swing.',
    durationLabel: '5–10 min',
    focusLabel: 'Stance · rotation · spacing',
    setup: {
      distance: '12–15 ft away',
      angle: 'Rear 45° · paddle side',
      orientation: 'Portrait · waist high',
      framing: 'Full body + paddle',
    },
    cameraSummary: 'Rear 45° on your paddle side · 12–15 feet away · portrait at waist height.',
    cameraInstructions: [
      'Place the phone 12–15 feet away at about waist height.',
      "Frame the player's full body, paddle, and contact point.",
      'Record from 45° behind the player on their paddle side.',
      'Keep the phone upright in portrait at about waist height.',
      'Keep the phone stationary for all 5 drives.',
      'Choose even lighting with minimal glare.',
    ],
  },
};
