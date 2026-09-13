import { Stack, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark } from '@/src/components/BrandMark';
import { AppIcon } from '@/src/components/ui/AppIcon';
import { Button } from '@/src/components/ui/Button';
import { colors } from '@/src/theme';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <BrandMark compact />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconWrap}>
          <AppIcon color={colors.primary} name="trail-sign-outline" size={46} />
        </View>
        <Text maxFontSizeMultiplier={1.5} style={styles.eyebrow}>WRONG COURT</Text>
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.title}>There’s no practice here.</Text>
        <Text style={styles.body}>The link may be old. Your local profile and practice history are still safe.</Text>
        <Button icon="home" label="Back to Today" onPress={() => router.replace('/')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 22, paddingTop: 8 },
  content: { flexGrow: 1, justifyContent: 'center', gap: 13, paddingHorizontal: 28, paddingTop: 18, paddingBottom: 70 },
  iconWrap: { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, marginBottom: 8 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: colors.text, fontSize: 35, lineHeight: 39, fontWeight: '900', letterSpacing: -1.2 },
  body: { color: colors.muted, fontSize: 14, lineHeight: 21, marginBottom: 8, maxWidth: 340 },
});
