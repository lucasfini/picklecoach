import { PracticeType } from '@/src/domain/practice';

export type DemoAnalysisContent = {
  source: 'demo';
  overall: number;
  biggestOpportunity: string;
  explanation: string;
  metrics: ReadonlyArray<readonly [label: string, score: number]>;
  drillTitle: string;
  drill: string;
};

/**
 * Product-copy fixtures only. Nothing in this map reads or describes the
 * player's recording; it previews the shape of future measured coaching.
 */
export const DEMO_ANALYSIS_RESULTS: Record<PracticeType, DemoAnalysisContent> = {
  serve: {
    source: 'demo',
    overall: 72,
    biggestOpportunity: 'Create an easier path into the swing.',
    explanation:
      'Example only: a measured result could use body landmarks to choose one setup detail, explain why it matters, and leave everything else quiet.',
    metrics: [
      ['Stance width', 78],
      ['Knee load', 68],
      ['Body turn', 74],
      ['Balance', 84],
      ['Follow-through', 63],
    ],
    drillTitle: 'Serve from a balanced base',
    drill:
      'Shadow 10 slow serves without stepping across your center line. Then hit 10 real serves at 60% pace and finish balanced for a two-count.',
  },
  dink: {
    source: 'demo',
    overall: 76,
    biggestOpportunity: 'Let the legs hold the ready position.',
    explanation:
      'Example only: a measured result could compare posture across the set and turn the clearest repeatable pattern into one calm focus.',
    metrics: [
      ['Ready posture', 71],
      ['Knee bend', 79],
      ['Stance width', 82],
      ['Body lean', 69],
      ['Balance', 81],
    ],
    drillTitle: 'Own the kitchen posture',
    drill:
      'Hold an athletic ready position for five seconds, relax, and repeat five times. Then dink 20 balls while returning to that same base after each contact.',
  },
  drive: {
    source: 'demo',
    overall: 70,
    biggestOpportunity: 'Start the turn before the forward swing.',
    explanation:
      'Example only: a measured result could use shoulder and hip landmarks to surface one timing pattern without guessing about the ball or paddle.',
    metrics: [
      ['Stance width', 75],
      ['Hip turn', 65],
      ['Shoulder turn', 72],
      ['Body lean', 77],
      ['Finish balance', 69],
    ],
    drillTitle: 'Turn, then send',
    drill:
      'Make 10 slow shadow swings: complete the unit turn, pause, then swing. Follow with 10 drives at 60% pace while keeping the same order.',
  },
};
