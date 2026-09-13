// Re-export the native module. On web, it will be resolved to PickleCoachPoseModule.web.ts
// and on native platforms to PickleCoachPoseModule.ts
export { default } from './src/PickleCoachPoseModule';
export * from './src/PickleCoachPose.types';
