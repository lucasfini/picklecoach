import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PoseTrackingPreview } from '@/src/components/analysis/PoseTrackingPreview';
import { PoseProcessingKeepAwake } from '@/src/components/analysis/PoseProcessingKeepAwake';
import { Card } from '@/src/components/Card';
import { ScoreBar } from '@/src/components/ScoreBar';
import { AppIcon } from '@/src/components/ui/AppIcon';
import { Button } from '@/src/components/ui/Button';
import { Tag } from '@/src/components/ui/Tag';
import { practices } from '@/src/data/practices';
import { isPracticeType } from '@/src/domain/practice';
import { formatRecordingDuration } from '@/src/domain/recordedPracticeSession';
import { PoseQualityIssue } from '@/src/domain/poseTracking';
import { useActivePracticeSession } from '@/src/providers/ActivePracticeSessionProvider';
import { usePracticeActivity } from '@/src/providers/PracticeActivityProvider';
import { demoAnalysisService, PracticeAnalysisResult } from '@/src/services/analysisService';
import { extractPoseFromVideo, PoseExtractionOutcome } from '@/src/services/poseEstimationService';
import { colors, radius } from '@/src/theme';

type AnalysisRouteParams = {
  sessionId?: string | string[];
  shot?: string | string[];
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function retakePresentation(issues: PoseQualityIssue[]) {
  if (issues.includes('processing-failed')) {
    return { eyebrow: 'TRACKING NEEDS ANOTHER TRY', title: 'The model lost this take.' };
  }
  if (issues.includes('person-not-found')) {
    return { eyebrow: 'STEP INTO FRAME', title: 'We could not find you.' };
  }
  if (issues.includes('multiple-people')) {
    return { eyebrow: 'ONE PLAYER NEEDED', title: 'Keep the frame yours.' };
  }
  if (issues.includes('subject-too-small')) {
    return { eyebrow: 'MOVE THE PHONE CLOSER', title: 'You are too far away.' };
  }
  if (issues.includes('body-not-fully-visible')) {
    return { eyebrow: 'FULL BODY NEEDED', title: 'We lost part of the skeleton.' };
  }
  if (issues.includes('tracking-lost')) {
    return { eyebrow: 'STEADIER VIEW NEEDED', title: 'Tracking dropped out.' };
  }
  return { eyebrow: 'LONGER TAKE NEEDED', title: 'Give us a few more seconds.' };
}

export default function AnalysisScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<AnalysisRouteParams>();
  const { activeSession, discardSession } = useActivePracticeSession();
  const { recordActivity } = usePracticeActivity();
  const sessionId = firstParam(params.sessionId);
  const shotParam = firstParam(params.shot);
  const fallbackPracticeType = isPracticeType(shotParam) ? shotParam : 'serve';
  const session = activeSession && activeSession.id === sessionId
    ? activeSession
    : null;
  const [demoResult, setDemoResult] = useState<PracticeAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [historySaveError, setHistorySaveError] = useState<string | null>(null);
  const [poseOutcome, setPoseOutcome] = useState<PoseExtractionOutcome | null>(null);

  useEffect(() => {
    let isActive = true;

    if (!session) {
      setDemoResult(null);
      setPoseOutcome(null);
      return;
    }

    setAnalysisError(null);
    setHistorySaveError(null);
    setPoseOutcome(null);
    void extractPoseFromVideo(session.videoUri).then((outcome) => {
      if (isActive) setPoseOutcome(outcome);
    });
    void demoAnalysisService
      .analyze(session)
      .then((analysisResult) => {
        if (isActive) setDemoResult(analysisResult);
      })
      .catch((error) => {
        console.warn('Demo analysis handoff failed.', error);
        if (isActive) setAnalysisError('The coaching preview could not be loaded. Your video was not uploaded.');
      });

    return () => {
      isActive = false;
    };
  }, [session]);

  useEffect(() => {
    if (!session || !poseOutcome) return;
    const passedTracking =
      poseOutcome.status === 'success' && poseOutcome.result.quality.status === 'usable';
    if (poseOutcome.status !== 'unsupported' && !passedTracking) return;

    let isActive = true;
    void recordActivity(session).catch((error) => {
      console.warn('Completed practice could not be saved to local history.', error);
      if (isActive) {
        setHistorySaveError('This take worked, but it could not be added to practice history.');
      }
    });
    return () => {
      isActive = false;
    };
  }, [poseOutcome, recordActivity, session]);

  useEffect(
    () => () => {
      if (session) {
        void discardSession(session.id);
      }
    },
    [discardSession, session],
  );

  useEffect(() => {
    if (session || !activeSession) return;
    void discardSession(activeSession.id);
  }, [activeSession, discardSession, session]);

  const startNewRecording = () => {
    router.replace({
      pathname: '/record/[shot]',
      params: { shot: session?.practiceType ?? fallbackPracticeType },
    });
  };

  if (!session) {
    return (
      <ScrollView contentContainerStyle={styles.stateScreen} showsVerticalScrollIndicator={false}>
        <Stack.Screen options={{ title: 'Recording unavailable' }} />
        <View style={styles.stateIconError}>
          <AppIcon color={colors.coral} name="videocam-off-outline" size={42} />
        </View>
        <Text maxFontSizeMultiplier={1.5} style={styles.stateEyebrow}>CLIP UNAVAILABLE</Text>
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.stateTitle}>Let’s record a fresh take.</Text>
        <Text style={styles.stateBody}>This local practice clip is no longer available.</Text>
        <Button icon="camera" label="Record a new clip" onPress={startNewRecording} />
      </ScrollView>
    );
  }

  const practice = practices[session.practiceType];

  if (!poseOutcome || (!demoResult && !analysisError)) {
    return (
      <ScrollView contentContainerStyle={styles.stateScreen} showsVerticalScrollIndicator={false}>
        {!poseOutcome ? <PoseProcessingKeepAwake /> : null}
        <Stack.Screen options={{ title: 'Tracking movement' }} />
        <View style={styles.stateIcon}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
        <Text maxFontSizeMultiplier={1.5} style={styles.stateEyebrow}>ON-DEVICE POSE TRACKING</Text>
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.stateTitle}>Finding your movement.</Text>
        <Text style={styles.stateBody}>Checking the clip frame by frame. It stays on this iPhone.</Text>
      </ScrollView>
    );
  }

  if (poseOutcome.status === 'error') {
    return (
      <ScrollView contentContainerStyle={styles.stateScreen} showsVerticalScrollIndicator={false}>
        <Stack.Screen options={{ title: 'Retake needed' }} />
        <View style={styles.stateIconError}>
          <AppIcon color={colors.coral} name="refresh" size={42} />
        </View>
        <Text maxFontSizeMultiplier={1.5} style={styles.stateEyebrow}>TRACKING DIDN’T FINISH</Text>
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.stateTitle}>Let’s take that one again.</Text>
        <Text style={styles.stateBody}>{poseOutcome.message}</Text>
        <Button icon="camera" label="Retake with guidance" onPress={startNewRecording} />
        <Button label="Back to practice" onPress={() => router.replace('/(tabs)')} variant="ghost" />
      </ScrollView>
    );
  }

  if (poseOutcome.status === 'success' && poseOutcome.result.quality.status === 'retake') {
    const { quality } = poseOutcome.result;
    const presentation = retakePresentation(quality.issues);
    return (
      <ScrollView contentContainerStyle={styles.stateScreen} showsVerticalScrollIndicator={false}>
        <Stack.Screen options={{ title: 'Retake needed' }} />
        <View style={styles.stateIconWarning}>
          <AppIcon color={colors.warning} name="body-outline" size={44} />
        </View>
        <Text maxFontSizeMultiplier={1.5} style={styles.stateEyebrow}>{presentation.eyebrow}</Text>
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.stateTitle}>{presentation.title}</Text>
        <Text style={styles.stateBody}>{quality.message}</Text>
        <View style={styles.retakeStats}>
          <Text style={styles.retakeStat}>{Math.round(quality.poseCoverage * 100)}% of frames found a body</Text>
          <Text style={styles.retakeStat}>{Math.round(quality.keyJointCoverage * 100)}% of key joints stayed visible</Text>
        </View>
        <Button icon="camera" label="Retake with guidance" onPress={startNewRecording} />
        <Text style={styles.retakePromise}>No score was created from this clip.</Text>
      </ScrollView>
    );
  }

  if (!demoResult) {
    return (
      <ScrollView contentContainerStyle={styles.stateScreen} showsVerticalScrollIndicator={false}>
        <Stack.Screen options={{ title: 'Coaching preview' }} />
        <View style={styles.stateIconError}>
          <AppIcon color={colors.coral} name="alert-circle-outline" size={42} />
        </View>
        <Text maxFontSizeMultiplier={1.5} style={styles.stateEyebrow}>PREVIEW UNAVAILABLE</Text>
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.stateTitle}>The sample result didn’t load.</Text>
        <Text style={styles.stateBody}>{analysisError}</Text>
        <Button icon="camera" label="Record another clip" onPress={startNewRecording} />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Stack.Screen options={{ title: 'Coaching preview' }} />

      <View style={styles.captureRow}>
        <Tag tone="green">TAKE CAPTURED</Tag>
        <Text style={styles.captureDetail}>{practice.title} · {formatRecordingDuration(session.duration)} · temporary</Text>
      </View>

      {historySaveError ? (
        <View accessibilityLiveRegion="polite" style={styles.historyErrorCard}>
          <AppIcon color={colors.danger} name="alert-circle-outline" size={19} />
          <Text style={styles.historyErrorText}>{historySaveError}</Text>
        </View>
      ) : null}

      {poseOutcome.status === 'success' ? (
        <PoseTrackingPreview result={poseOutcome.result} videoUri={session.videoUri} />
      ) : (
        <View style={styles.poseUnavailableCard}>
          <View style={styles.poseUnavailableIcon}>
            <AppIcon color={colors.primary} name="body-outline" size={25} />
          </View>
          <View style={styles.poseUnavailableCopy}>
            <Text style={styles.poseUnavailableTitle}>Pose preview needs the latest iPhone build</Text>
            <Text style={styles.poseUnavailableBody}>{poseOutcome.message}</Text>
          </View>
        </View>
      )}

      <View style={styles.demoBanner}>
        <View style={styles.demoIcon}>
          <AppIcon color={colors.warning} name="flask-outline" size={20} />
        </View>
        <View style={styles.demoCopy}>
          <Text style={styles.demoTitle}>DEMO DATA · NOT VIDEO-DERIVED</Text>
          <Text style={styles.demoBody}>Your clip was captured, but the result below is only an example.</Text>
        </View>
      </View>

      <View style={styles.scoreHero}>
        <View style={styles.scoreCopy}>
          <Text maxFontSizeMultiplier={1.5} style={styles.scoreEyebrow}>SAMPLE SCORE</Text>
          <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.scoreTitle}>Here’s how coaching will feel.</Text>
          <Text style={styles.scoreSubhead}>One clear focus, then a short drill to work on it.</Text>
        </View>
        <View
          accessible
          accessibilityLabel={`Sample demo score ${demoResult.overall} out of 100. Not video-derived.`}
          style={styles.scoreCircle}
        >
          <Text style={styles.score}>{demoResult.overall}</Text>
          <Text style={styles.outOf}>/100</Text>
        </View>
      </View>

      <Card style={styles.priorityCard}>
        <View style={styles.cardIconLime}>
          <AppIcon color={colors.ink} name="sparkles" size={21} />
        </View>
        <Text style={styles.label}>EXAMPLE COACHING FOCUS</Text>
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.priority}>{demoResult.biggestOpportunity}</Text>
        <Text style={styles.body}>{demoResult.explanation}</Text>
      </Card>

      <Card style={styles.metricCard}>
        <View style={styles.cardHeadingRow}>
          <View style={styles.cardHeadingCopy}>
            <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.cardTitle}>Example breakdown</Text>
            <Text style={styles.cardSubtitle}>These numbers are sample data.</Text>
          </View>
          <View style={styles.cardIconGreen}>
            <AppIcon color={colors.primary} name="stats-chart" size={19} />
          </View>
        </View>
        <View style={styles.metrics}>
          {demoResult.metrics.map(([label, score]) => <ScoreBar key={label} label={label} score={score} />)}
        </View>
      </Card>

      <Card style={styles.drillCard}>
        <View style={styles.drillHeader}>
          <View style={styles.cardIconCoral}>
            <AppIcon color={colors.coral} name="timer-outline" size={21} />
          </View>
          <Tag tone="coral">5-MINUTE DRILL</Tag>
        </View>
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.cardTitle}>{demoResult.drillTitle}</Text>
        <Text style={styles.body}>{demoResult.drill}</Text>
      </Card>

      <Button icon="refresh" label="Practice it again" onPress={startNewRecording} />
      <Button icon="stats-chart-outline" label="View practice history" onPress={() => router.replace('/(tabs)/progress')} variant="secondary" />

      <View style={styles.disclaimerRow}>
        <AppIcon color={colors.subtle} name="information-circle-outline" size={15} />
        <Text style={styles.disclaimer}>Measured coaching will only appear after pose tracking passes quality checks.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, paddingBottom: 42, gap: 15, backgroundColor: colors.background },
  demoBanner: { minHeight: 74, borderRadius: radius.md, backgroundColor: colors.warningSoft, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  demoIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  demoCopy: { flex: 1, gap: 3 },
  demoTitle: { color: colors.warning, fontSize: 10, fontWeight: '900', letterSpacing: 0.65 },
  demoBody: { color: colors.text, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  captureRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingHorizontal: 2 },
  captureDetail: { flex: 1, color: colors.muted, fontSize: 11, fontWeight: '700', textAlign: 'right' },
  historyErrorCard: { borderRadius: radius.sm, flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12, backgroundColor: colors.dangerSoft },
  historyErrorText: { flex: 1, color: colors.danger, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  poseUnavailableCard: { minHeight: 94, borderRadius: radius.md, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.primaryMist },
  poseUnavailableIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  poseUnavailableCopy: { flex: 1, gap: 4 },
  poseUnavailableTitle: { color: colors.text, fontSize: 14, lineHeight: 18, fontWeight: '900' },
  poseUnavailableBody: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  scoreHero: { minHeight: 218, borderRadius: radius.lg, backgroundColor: colors.ink, padding: 22, flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden' },
  scoreCopy: { flex: 1, gap: 8 },
  scoreEyebrow: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.05 },
  scoreTitle: { color: colors.white, fontSize: 25, lineHeight: 29, fontWeight: '900', letterSpacing: -0.7 },
  scoreSubhead: { color: '#B7C2BC', fontSize: 12, lineHeight: 18 },
  scoreCircle: { width: 112, height: 112, borderRadius: 56, backgroundColor: colors.primary, borderWidth: 7, borderColor: '#214536', alignItems: 'baseline', justifyContent: 'center', flexDirection: 'row', paddingTop: 34 },
  score: { color: colors.white, fontSize: 41, fontWeight: '900', letterSpacing: -1.5 },
  outOf: { color: '#B9D8CB', fontSize: 11, fontWeight: '800' },
  priorityCard: { backgroundColor: colors.accentSoft, gap: 8 },
  cardIconLime: { width: 43, height: 43, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, marginBottom: 3 },
  cardIconGreen: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  cardIconCoral: { width: 43, height: 43, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.coralSoft },
  label: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 0.85 },
  priority: { color: colors.text, fontSize: 23, lineHeight: 28, fontWeight: '900', letterSpacing: -0.5 },
  body: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  metricCard: { gap: 20 },
  cardHeadingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  cardHeadingCopy: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: 20, lineHeight: 25, fontWeight: '900', letterSpacing: -0.35 },
  cardSubtitle: { color: colors.subtle, fontSize: 11, marginTop: 3 },
  metrics: { gap: 17 },
  drillCard: { gap: 10 },
  drillHeader: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  disclaimerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 6, paddingHorizontal: 14, paddingTop: 2 },
  disclaimer: { flex: 1, color: colors.subtle, fontSize: 10, lineHeight: 15, textAlign: 'center' },
  stateScreen: { flexGrow: 1, justifyContent: 'center', gap: 13, padding: 28, backgroundColor: colors.background },
  stateIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, marginBottom: 8 },
  stateIconError: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.coralSoft, marginBottom: 8 },
  stateIconWarning: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.warningSoft, marginBottom: 8 },
  stateEyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.15 },
  stateTitle: { color: colors.text, fontSize: 31, lineHeight: 36, fontWeight: '900', letterSpacing: -0.9 },
  stateBody: { color: colors.muted, fontSize: 14, lineHeight: 21, marginBottom: 8 },
  retakeStats: { borderRadius: radius.md, padding: 15, gap: 7, backgroundColor: colors.surface, marginBottom: 4 },
  retakeStat: { color: colors.text, fontSize: 12, lineHeight: 17, fontWeight: '800' },
  retakePromise: { color: colors.subtle, fontSize: 11, fontWeight: '700', textAlign: 'center' },
});
