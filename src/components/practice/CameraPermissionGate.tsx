import { PermissionResponse } from 'expo-camera';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon, AppIconName } from '@/src/components/ui/AppIcon';
import { Button } from '@/src/components/ui/Button';
import { colors, radius, shadows } from '@/src/theme';

type CameraPermissionGateProps = {
  cameraPermission: PermissionResponse | null;
  isRequesting: boolean;
  requestError: string | null;
  onRequest: () => void;
  onBack: () => void;
};

export function CameraPermissionGate({
  cameraPermission,
  isRequesting,
  requestError,
  onRequest,
  onBack,
}: CameraPermissionGateProps) {
  const permissions: { icon: AppIconName; label: string; permission: PermissionResponse | null }[] = [
    { icon: 'camera-outline', label: 'Camera', permission: cameraPermission },
  ];
  const mustOpenSettings = permissions.some(
    ({ permission }) => permission && !permission.granted && !permission.canAskAgain,
  );
  const hasDeniedPermission = permissions.some(
    ({ permission }) => permission?.status === 'denied',
  );

  const handleOpenSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      // The recovery instructions remain visible if Settings cannot open directly.
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Back to camera setup"
          accessibilityRole="button"
          hitSlop={12}
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <AppIcon color={colors.text} name="chevron-back" size={22} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.visual}>
          <View style={styles.visualHalo} />
          <View style={styles.cameraIcon}>
            <AppIcon color={colors.white} name="camera" size={38} />
          </View>
        </View>

        <View style={styles.copy}>
          <Text maxFontSizeMultiplier={1.5} style={styles.eyebrow}>ONE-TIME SETUP</Text>
          <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.title}>Ready when you are.</Text>
          <Text style={styles.body}>Allow the camera to capture a silent practice clip. It stays on this iPhone and is deleted after review.</Text>
        </View>

        <View style={styles.permissionList}>
          {permissions.map(({ icon, label, permission }, index) => (
            <View
              key={label}
              accessible
              accessibilityLabel={`${label} permission, ${permission?.granted ? 'allowed' : 'needed'}`}
              style={[styles.permissionRow, index > 0 && styles.permissionBorder]}
            >
              <View style={styles.permissionName}>
                <View style={styles.permissionIcon}>
                  <AppIcon color={colors.primary} name={icon} size={19} />
                </View>
                <Text maxFontSizeMultiplier={1.8} style={styles.permissionLabel}>{label}</Text>
              </View>
              <View style={[styles.statusPill, permission?.granted && styles.statusGranted]}>
                <AppIcon
                  color={permission?.granted ? colors.primary : colors.muted}
                  name={permission?.granted ? 'checkmark' : 'arrow-forward'}
                  size={13}
                />
                <Text maxFontSizeMultiplier={1.5} style={[styles.permissionStatus, permission?.granted && styles.permissionGranted]}>
                  {permission?.granted ? 'Allowed' : 'Needed'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {requestError ? (
          <View style={styles.errorCard}>
            <AppIcon color={colors.danger} name="alert-circle-outline" size={19} />
            <Text style={styles.error}>{requestError}</Text>
          </View>
        ) : null}

        {mustOpenSettings ? (
          <View style={styles.actionWrap}>
            <Text style={styles.deniedText}>Camera access is off. Enable it in Settings, then come back.</Text>
            <Button icon="settings-outline" label="Open Settings" onPress={() => void handleOpenSettings()} />
          </View>
        ) : (
          <Button
            disabled={isRequesting}
            icon={isRequesting ? undefined : 'arrow-forward'}
            label={isRequesting ? 'Requesting access…' : hasDeniedPermission ? 'Try again' : 'Allow access'}
            onPress={onRequest}
          />
        )}

        <View style={styles.privacyNote}>
          <AppIcon color={colors.primary} name="lock-closed-outline" size={14} />
          <Text style={styles.privacyText}>No audio is recorded. Nothing is uploaded.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  topBar: { minHeight: 54, justifyContent: 'center', paddingHorizontal: 18 },
  backButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 22, paddingTop: 12, paddingBottom: 36, gap: 20 },
  visual: { height: 122, alignItems: 'center', justifyContent: 'center' },
  visualHalo: { position: 'absolute', width: 122, height: 122, borderRadius: 61, backgroundColor: colors.accentSoft },
  cameraIcon: { width: 80, height: 66, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-3deg' }], ...shadows.floating },
  copy: { alignItems: 'center', gap: 7 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  title: { color: colors.text, fontSize: 34, lineHeight: 39, fontWeight: '900', letterSpacing: -1.1, textAlign: 'center' },
  body: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 330 },
  permissionList: { backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: 15, ...shadows.card },
  permissionRow: { minHeight: 62, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 7 },
  permissionBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  permissionName: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  permissionIcon: { width: 35, height: 35, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryMist },
  permissionLabel: { color: colors.text, fontSize: 15, fontWeight: '800' },
  statusPill: { minHeight: 28, paddingHorizontal: 9, borderRadius: radius.pill, flexDirection: 'row', gap: 4, alignItems: 'center', backgroundColor: colors.surfaceMuted },
  statusGranted: { backgroundColor: colors.primarySoft },
  permissionStatus: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 0.25 },
  permissionGranted: { color: colors.primary },
  actionWrap: { gap: 12 },
  deniedText: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center', paddingHorizontal: 10 },
  errorCard: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12, borderRadius: radius.sm, backgroundColor: colors.dangerSoft },
  error: { flex: 1, color: colors.danger, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  privacyNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  privacyText: { color: colors.subtle, fontSize: 11, fontWeight: '700' },
  pressed: { opacity: 0.65 },
});
