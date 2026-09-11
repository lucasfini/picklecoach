export type ShotType = 'serve' | 'dink' | 'drive';

export const shots: Record<ShotType, { title: string; emoji: string; description: string; camera: string }> = {
  serve: {
    title: 'Serve',
    emoji: '🎯',
    description: 'Measure setup, contact position, balance, and follow-through.',
    camera: 'Place your phone 10–12 ft away, landscape, facing your hitting side.',
  },
  dink: {
    title: 'Dink',
    emoji: '🏓',
    description: 'Review posture, paddle preparation, contact, and recovery.',
    camera: 'Place your phone near the sideline so your full body and kitchen line stay visible.',
  },
  drive: {
    title: 'Drive',
    emoji: '⚡',
    description: 'Analyze stance, rotation, contact spacing, and recovery.',
    camera: 'Place your phone 12–15 ft away at waist height, perpendicular to your swing path.',
  },
};

export const mockResults = {
  overall: 72,
  biggestOpportunity: 'Create more space between your body and the ball at contact.',
  metrics: [
    ['Contact position', 68],
    ['Knee bend', 82],
    ['Balance', 87],
    ['Follow-through', 61],
    ['Consistency', 74],
  ] as const,
  drill: 'Shadow 10 slow serves while keeping roughly one forearm of space at contact. Then hit 10 real serves at 60% pace.',
};
