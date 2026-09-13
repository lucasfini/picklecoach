import { Platform } from 'react-native';
import { parsePoseExtractionResult, PoseExtractionResult } from '@/src/domain/poseTracking';
import {
  PoseExtractionTimeoutError,
  withPoseExtractionDeadline,
} from '@/src/services/poseExtractionDeadline';

export type PoseExtractionOutcome =
  | { status: 'success'; result: PoseExtractionResult; runtimeMilliseconds: number }
  | { status: 'unsupported'; message: string }
  | { status: 'error'; message: string; runtimeMilliseconds: number };

const TARGET_FRAMES_PER_SECOND = 8;
const MAXIMUM_FRAMES = 240;
const MINIMUM_JOINT_CONFIDENCE = 0.25;

export async function extractPoseFromVideo(videoUri: string): Promise<PoseExtractionOutcome> {
  if (Platform.OS !== 'ios') {
    return {
      status: 'unsupported',
      message: 'On-device pose tracking is currently available in the iPhone development build.',
    };
  }

  const startedAt = Date.now();
  try {
    const { default: poseModule } = await import('../../modules/picklecoach-pose');
    const nativeResult = await withPoseExtractionDeadline(
      poseModule.extractPose(
        videoUri,
        TARGET_FRAMES_PER_SECOND,
        MAXIMUM_FRAMES,
        MINIMUM_JOINT_CONFIDENCE,
      ),
    );
    const result = parsePoseExtractionResult(nativeResult);

    if (!result) {
      return {
        status: 'error',
        message: 'Pose tracking returned an unreadable result. Record a new clip and try again.',
        runtimeMilliseconds: Date.now() - startedAt,
      };
    }

    return { status: 'success', result, runtimeMilliseconds: Date.now() - startedAt };
  } catch (error) {
    console.warn('On-device pose extraction failed.', error);
    if (error instanceof PoseExtractionTimeoutError) {
      return {
        status: 'error',
        message: 'Pose tracking took too long. Record a shorter take and try again.',
        runtimeMilliseconds: Date.now() - startedAt,
      };
    }
    const detail = error instanceof Error ? error.message : '';
    if (detail.includes('Cannot find native module') || detail.includes('not been registered')) {
      return {
        status: 'unsupported',
        message: 'Rebuild the development app once to enable the new on-device pose preview.',
      };
    }
    return {
      status: 'error',
      message: 'We could not track this clip. The video stayed on your iPhone.',
      runtimeMilliseconds: Date.now() - startedAt,
    };
  }
}
