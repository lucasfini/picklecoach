import { registerWebModule, NativeModule } from 'expo';

// PickleCoachPoseModule is not available on the web platform.
class PickleCoachPoseModule extends NativeModule<{}> {}

export default registerWebModule(PickleCoachPoseModule, 'PickleCoachPoseModule');
