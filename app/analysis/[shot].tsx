import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/src/components/Card';
import { ScoreBar } from '@/src/components/ScoreBar';
import { practices } from '@/src/data/practices';
import { isPracticeType } from '@/src/domain/practice';
import {
  formatRecordingDuration,
  recordedPracticeSessionFromParams,
} from '@/src/domain/recordedPracticeSession';
import {
  demoAnalysisService,
  PracticeAnalysisResult,
} from '@/src/services/analysisService';
import { deleteLocalRecording } from '@/src/services/localRecordingFiles';
import { colors, radius } from '@/src/theme';

type AnalysisRouteParams = {
  sessionId?: string | string[];
  shot?: string | string[];
  videoUri?: string | string[];
  recordedAt?: string | string[];
  duration?: string | string[];
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function AnalysisScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<AnalysisRouteParams>();
  const sessionId = firstParam(params.sessionId);
  const shotParam = firstParam(params.shot);
  const videoUri = firstParam(params.videoUri);
  const recordedAt = firstParam(params.recordedAt);
  const duration = firstParam(params.duration);
  const fallbackPracticeType = isPracticeType(shotParam) ? shotParam : 'serve';
  const session = useMemo(
    () =>
      recordedPracticeSessionFromParams({
        sessionId,
        shot: shotParam,
        videoUri,
        recordedAt,
        duration,
      }),
    [duration, recordedAt, sessionId, shotParam, videoUri],
  );
  const [result, setResult] = useState<PracticeAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    if (!session) {
      setResult(null);
      return;
    }

    setAnalysisError(null);
    void demoAnalysisService
      .analyze(session)
      .then((analysisResult) => {
        if (isActive) {
          setResult(analysisResult);
        }
      })
      .catch((error) => {
        console.warn('Demo analysis handoff failed.', error);
        if (isActive) {
          setAnalysisError('The coaching preview could not be loaded. Your video was not uploaded.');
        }
      });

    return () => {
      isActive = false;
    };
  }, [session]);

  useEffect(
    () => () => {
      if (session) {
        void deleteLocalRecording(session.videoUri);
      }
    },
    [session],
  );

  const startNewRecording = () => {
    router.replace({
      pathname: '/record/[shot]',
      params: { shot: session?.practiceType ?? fallbackPracticeType },
    });
  };

  if (!session) {
    return (
      <View style={styles.stateScreen}>
        <Stack.Screen options={{ title: 'Recording unavailable' }} />
        <Text style={styles.stateEyebrow}>RECORDING UNAVAILABLE</Text>
        <Text style={styles.stateTitle}>This practice clip is no longer available.</Text>
        <Text style={styles.stateBody}>Record a new local clip to continue to the coaching preview.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={startNewRecording}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.primaryButtonText}>Record a new clip</Text>
        </Pressable>
      </View>
    );
  }

  const practice = practices[session.practiceType];

  if (!result && !analysisError) {
    return (
      <View style={styles.stateScreen}>
        <Stack.Screen options={{ title: 'Coaching preview' }} />
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.stateTitle}>Loading demo coaching…</Text>
        <Text style={styles.stateBody}>No pose estimation or video-derived scoring is running yet.</Text>
      </View>
    );
  }

  if (!result) {
    return (
      <View style={styles.stateScreen}>
        <Stack.Screen options={{ title: 'Coaching preview' }} />
        <Text style={styles.stateEyebrow}>PREVIEW UNAVAILABLE</Text>
        <Text style={styles.stateTitle}>We could not load the demo result.</Text>
        <Text style={styles.stateBody}>{analysisError}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={startNewRecording}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.primaryButtonText}>Record another clip</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: 'Demo coaching preview' }} />

      <View style={styles.demoBanner}>
        <Text style={styles.demoBannerText}>DEMO DATA · NOT VIDEO-DERIVED</Text>
      </View>

      <View style={styles.scoreWrap}>
        <Text style={styles.label}>{practice.title.toUpperCase()} DEMO SCORE</Text>
        <View style={styles.scoreCircle}>
          <Text style={styles.score}>{result.overall}</Text>
          <Text style={styles.outOf}>/100</Text>
        </View>
        <Text style={styles.improved}>Demo: 6 points above the sample baseline</Text>
        <Text style={styles.captureDetail}>
          Local clip received · {formatRecordingDuration(session.duration)}
        </Text>
      </View>

      <Card style={styles.priorityCard}>
        <Text style={styles.label}>DEMO OPPORTUNITY</Text>
        <Text style={styles.priority}>{result.biggestOpportunity}</Text>
        <Text style={styles.body}>{result.explanation}</Text>
      </Card>

      <Card style={styles.metricCard}>
        <Text style={styles.cardTitle}>Demo technique breakdown</Text>
        <View style={styles.metrics}>
          {result.metrics.map(([label, score]) => (
            <ScoreBar key={label} label={label} score={score} />
          ))}
        </View>
      </Card>

      <Card style={styles.drillCard}>
        <Text style={styles.label}>DEMO 5-MINUTE DRILL</Text>
        <Text style={styles.cardTitle}>{result.drillTitle}</Text>
        <Text style={styles.body}>{result.drill}</Text>
      </Card>

      <Pressable
        accessibilityRole="button"
        onPress={startNewRecording}
        style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
      >
        <Text style={styles.primaryButtonText}>Practice it again</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.replace('/(tabs)/progress')}
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
      >
        <Text style={styles.secondaryButtonText}>View progress</Text>
      </Pressable>
      <Text style={styles.disclaimer}>
        This result is fixed demo content. It was not calculated from your recording. Production coaching must be grounded in measured pose/video features.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, paddingBottom: 42, gap: 14, backgroundColor: colors.background },
  demoBanner: {
    minHeight: 34,
    borderRadius: radius.sm,
    backgroundColor: '#FFF3D9',
    borderWidth: 1,
    borderColor: '#E5C77D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  demoBannerText: { color: '#76510A', fontSize: 11, fontWeight: '900', textAlign: 'center' },
  scoreWrap: { alignItems: 'center', gap: 8, paddingVertical: 12 },
  label: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  scoreCircle: {
    width: 134,
    height: 134,
    borderRadius: 67,
    backgroundColor: colors.primary,
    alignItems: 'baseline',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingTop: 42,
  },
  score: { color: '#FFFFFF', fontSize: 50, fontWeight: '900' },
  outOf: { color: '#D7E5D9', fontSize: 14, fontWeight: '700' },
  improved: { color: colors.primary, fontWeight: '800', fontSize: 14, textAlign: 'center' },
  captureDetail: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  priorityCard: { backgroundColor: colors.primarySoft, borderColor: '#CDE2D0', gap: 8 },
  priority: { color: colors.text, fontSize: 23, lineHeight: 29, fontWeight: '900' },
  body: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  metricCard: { gap: 18 },
  cardTitle: { color: colors.text, fontSize: 19, lineHeight: 24, fontWeight: '900' },
  metrics: { gap: 16 },
  drillCard: { gap: 8 },
  primaryButton: {
    minHeight: 54,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', textAlign: 'center' },
  secondaryButton: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  secondaryButtonText: { color: colors.text, fontSize: 16, fontWeight: '800' },
  buttonPressed: { opacity: 0.82 },
  disclaimer: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: 'center', paddingHorizontal: 12 },
  stateScreen: {
    flex: 1,
    justifyContent: 'center',
    gap: 14,
    padding: 28,
    backgroundColor: colors.background,
  },
  stateEyebrow: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  stateTitle: { color: colors.text, fontSize: 27, lineHeight: 33, fontWeight: '900' },
  stateBody: { color: colors.muted, fontSize: 15, lineHeight: 22, marginBottom: 6 },
});
