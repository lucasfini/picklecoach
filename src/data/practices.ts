import { PracticeType } from '@/src/domain/practice';

export type PracticeDefinition = {
  title: string;
  emoji: string;
  description: string;
  cameraSummary: string;
  cameraInstructions: string[];
};

export const practices: Record<PracticeType, PracticeDefinition> = {
  serve: {
    title: 'Serve',
    emoji: '🎯',
    description: 'Measure setup, contact position, balance, and follow-through.',
    cameraSummary: 'Set up about 10 feet away at your hitting-side profile.',
    cameraInstructions: [
      'Place the phone roughly 10 feet away.',
      "Frame the player's full body, paddle, and contact point.",
      'Record from the hitting-side profile angle.',
      'Keep the phone stationary for all 5 serves.',
      'Choose a spot with enough light to see the full motion.',
    ],
  },
  dink: {
    title: 'Dink',
    emoji: '🏓',
    description: 'Review posture, paddle preparation, contact, and recovery.',
    cameraSummary: 'Set up near the sideline with the kitchen line in view.',
    cameraInstructions: [
      'Place the phone near the sideline at about waist height.',
      "Frame the player's full body and the kitchen line.",
      'Use a side angle that keeps paddle preparation visible.',
      'Keep the phone stationary for all 5 dinks.',
      'Avoid strong backlighting across the court.',
    ],
  },
  drive: {
    title: 'Drive',
    emoji: '⚡',
    description: 'Analyze stance, rotation, contact spacing, and recovery.',
    cameraSummary: 'Set up 12–15 feet away, perpendicular to the swing path.',
    cameraInstructions: [
      'Place the phone 12–15 feet away at about waist height.',
      "Frame the player's full body, paddle, and contact point.",
      'Record perpendicular to the swing path.',
      'Keep the phone stationary for all 5 drives.',
      'Choose even lighting with minimal glare.',
    ],
  },
};
