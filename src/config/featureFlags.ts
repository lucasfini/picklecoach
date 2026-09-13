export function resolvePoseLabAccess({
  explicitlyEnabled,
  isDevelopment,
}: {
  explicitlyEnabled?: string;
  isDevelopment: boolean;
}) {
  return isDevelopment || explicitlyEnabled === '1';
}

export const isPoseLabEnabled = resolvePoseLabAccess({
  explicitlyEnabled: process.env.EXPO_PUBLIC_POSE_LAB_ENABLED,
  isDevelopment: typeof __DEV__ !== 'undefined' && __DEV__,
});

export const shouldAutostartPoseLab =
  isPoseLabEnabled && process.env.EXPO_PUBLIC_POSE_LAB_AUTOSTART === '1';
