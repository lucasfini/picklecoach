import { NativeModule, requireNativeModule } from 'expo';
import { NativePoseExtractionResult } from './PickleCoachPose.types';

declare class PickleCoachPoseModule extends NativeModule<{}> {
  extractPose(
    videoUri: string,
    targetFramesPerSecond: number,
    maximumFrames: number,
    minimumConfidence: number,
  ): Promise<NativePoseExtractionResult>;
}

export default requireNativeModule<PickleCoachPoseModule>('PickleCoachPose');
