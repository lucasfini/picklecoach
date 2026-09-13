import { useKeepAwake } from 'expo-keep-awake';

/**
 * Mount only while on-device pose extraction is active. Keeping the lock in a
 * component makes acquisition and release follow the processing UI lifecycle.
 */
export function PoseProcessingKeepAwake() {
  useKeepAwake('picklecoach-pose-processing');
  return null;
}
