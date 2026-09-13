import { PermissionResponse } from 'expo-camera';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from '@/src/theme';

type CameraPermissionGateProps = {
  cameraPermission: PermissionResponse | null;
  microphonePermission: PermissionResponse | null;
  isRequesting: boolean;
  requestError: string | null;
  onRequest: () => void;
  onBack: () => void;
};

export function CameraPermissionGate({
  cameraPermission,
  microphonePermission,
  isRequesting,
  requestError,
  onRequest,
  onBack,
}: CameraPermissionGateProps) {
  const permissions = [
    { label: 'Camera', permission: cameraPermission },
    { label: 'Microphone', permission: microphonePermission },
  ];
  const mustOpenSettings = permissions.some(
    ({ permission }) => permission && !permission.granted && !permission.canAskAgain,
  );

  const handleOpenSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      // The explanation remains visible if the platform cannot open settings directly.
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={onBack} hitSlop={12}>
          <Text style={styles.backButton}>Back</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.icon}>
          <View style={styles.lens} />
        </View>
        <Text style={styles.title}>Camera and microphone access</Text>
        <Text style={styles.body}>
          PickleCoach needs both to record your practice clip. Your video stays local on this device.
        </Text>

        <View style={styles.permissionList}>
          {permissions.map(({ label, permission }) => (
            <View key={label} style={styles.permissionRow}>
              <Text style={styles.permissionLabel}>{label}</Text>
              <Text style={[styles.permissionStatus, permission?.granted && styles.permissionGranted]}>
                {permission?.granted ? 'Allowed' : 'Needed'}
              </Text>
            </View>
          ))}
        </View>

        {requestError ? <Text style={styles.error}>{requestError}</Text> : null}

        {mustOpenSettings ? (
          <>
            <Text style={styles.deniedText}>
              Access is turned off. Open Settings, allow Camera and Microphone, then return here.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={handleOpenSettings}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.primaryButtonText}>Open Settings</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            accessibilityRole="button"
            disabled={isRequesting}
            onPress={onRequest}
            style={({ pressed }) => [
              styles.primaryButton,
              isRequesting && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
          >
            {isRequesting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {cameraPermission || microphonePermission ? 'Try again' : 'Allow access'}
              </Text>
            )}
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  topBar: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 20 },
  backButton: { color: colors.primary, fontSize: 16, fontWeight: '800' },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 72,
    gap: 16,
  },
  icon: {
    width: 74,
    height: 58,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  lens: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 4,
    borderColor: colors.accent,
  },
  title: { color: colors.text, fontSize: 28, lineHeight: 34, fontWeight: '900', textAlign: 'center' },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  permissionList: {
    marginTop: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  permissionRow: {
    minHeight: 54,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  permissionLabel: { color: colors.text, fontSize: 15, fontWeight: '700' },
  permissionStatus: { color: colors.danger, fontSize: 13, fontWeight: '900' },
  permissionGranted: { color: colors.primary },
  deniedText: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  error: { color: colors.danger, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  primaryButton: {
    minHeight: 54,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  buttonPressed: { opacity: 0.82 },
  buttonDisabled: { opacity: 0.55 },
});
