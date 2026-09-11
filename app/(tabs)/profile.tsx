import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/src/components/Card';
import { colors } from '@/src/theme';

export default function ProfileScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.avatar}><Text style={styles.avatarText}>LF</Text></View>
      <Text style={styles.name}>Player profile</Text>
      <Text style={styles.subtitle}>Built around improvement, not an endless feed.</Text>

      <Card style={styles.card}>
        <Text style={styles.label}>CURRENT LEVEL</Text>
        <Text style={styles.value}>Around 3.0</Text>
        <Text style={styles.body}>Goal: build consistency and reach confident 3.5 play.</Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.label}>FOCUS</Text>
        <View style={styles.chips}>
          {['Serve', 'Dink', 'Footwork'].map((chip) => <View key={chip} style={styles.chip}><Text style={styles.chipText}>{chip}</Text></View>)}
        </View>
      </Card>

      <Card style={[styles.card, styles.proCard]}>
        <Text style={styles.label}>PICKLECOACH PRO</Text>
        <Text style={styles.value}>Unlimited coaching sessions</Text>
        <Text style={styles.body}>Pricing hypothesis: $9.99/month or $59.99/year. Purchases are intentionally not wired yet.</Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.label}>PRIVACY PRINCIPLE</Text>
        <Text style={styles.body}>Practice video should be processed with minimal retention. Long term, pose extraction should happen on-device where practical.</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, paddingBottom: 40, gap: 14, alignItems: 'stretch', backgroundColor: colors.background },
  avatar: { width: 82, height: 82, borderRadius: 41, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 10 },
  avatarText: { color: 'white', fontSize: 26, fontWeight: '900' },
  name: { color: colors.text, fontSize: 28, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: colors.muted, textAlign: 'center', fontSize: 14, marginBottom: 8 },
  card: { gap: 8 },
  proCard: { backgroundColor: colors.primarySoft, borderColor: '#CDE2D0' },
  label: { color: colors.primary, fontSize: 11, letterSpacing: 1.5, fontWeight: '900' },
  value: { color: colors.text, fontSize: 20, fontWeight: '900' },
  body: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: colors.primarySoft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipText: { color: colors.primary, fontWeight: '800', fontSize: 13 },
});
