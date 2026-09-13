import { DEMO_ANALYSIS_RESULT } from '@/src/data/demoAnalysis';
import { RecordedPracticeSession } from '@/src/domain/recordedPracticeSession';

export type PracticeAnalysisResult = typeof DEMO_ANALYSIS_RESULT & {
  sessionId: string;
};

export interface PracticeAnalysisService {
  analyze(session: RecordedPracticeSession): Promise<PracticeAnalysisResult>;
}

export const demoAnalysisService: PracticeAnalysisService = {
  async analyze(session) {
    // This adapter deliberately does not read or interpret the video. Replace this
    // service boundary with measured pose analysis in the next milestone.
    return {
      ...DEMO_ANALYSIS_RESULT,
      sessionId: session.id,
    };
  },
};
