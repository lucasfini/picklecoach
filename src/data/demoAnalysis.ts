export const DEMO_ANALYSIS_RESULT = {
  source: 'demo' as const,
  overall: 72,
  biggestOpportunity: 'Create more space between your body and the ball at contact.',
  explanation:
    'Your balance is solid, but the contact point is getting crowded. Fixing spacing first should make the rest of the motion easier.',
  metrics: [
    ['Contact position', 68],
    ['Knee bend', 82],
    ['Balance', 87],
    ['Follow-through', 61],
    ['Consistency', 74],
  ] as const,
  drillTitle: 'Give yourself room at contact',
  drill:
    'Shadow 10 slow serves while keeping roughly one forearm of space at contact. Then hit 10 real serves at 60% pace.',
};
