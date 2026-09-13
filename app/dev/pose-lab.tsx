import * as Device from 'expo-device';
import * as ImagePicker from 'expo-image-picker';
import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PoseTrackingPreview } from '@/src/components/analysis/PoseTrackingPreview';
import { PoseProcessingKeepAwake } from '@/src/components/analysis/PoseProcessingKeepAwake';
import { BenchmarkCasePicker } from '@/src/components/analysis/BenchmarkCasePicker';
import { BenchmarkProgress } from '@/src/components/analysis/BenchmarkProgress';
import { BenchmarkVisualReview } from '@/src/components/analysis/BenchmarkVisualReview';
import { Card } from '@/src/components/Card';
import { AppIcon } from '@/src/components/ui/AppIcon';
import { Button } from '@/src/components/ui/Button';
import { Tag } from '@/src/components/ui/Tag';
import { isPoseLabEnabled } from '@/src/config/featureFlags';
import { practices } from '@/src/data/practices';
import {
  assessPoseBenchmarkCase,
  benchmarkRunFromResult,
  buildPoseBenchmarkReport,
  compareBenchmarkRuns,
  createClipFingerprint,
  createRecordedSessionClipFingerprint,
  getNextUnqualifiedPoseBenchmarkCase,
  isPoseBenchmarkRunQualified,
  PoseBenchmarkRun,
  PoseBenchmarkVisualIssue,
  withBenchmarkVisualReview,
} from '@/src/domain/poseBenchmark';
import {
  getPoseBenchmarkCase,
  getPoseBenchmarkCasesForPractice,
  isPoseBenchmarkCaseId,
  PoseBenchmarkCaseId,
} from '@/src/domain/poseBenchmarkProtocol';
import { PracticeType, practiceTypes } from '@/src/domain/practice';
import { formatPosePercentage } from '@/src/domain/poseTracking';
import {
  formatRecordingDuration,
  MAX_RECORDING_DURATION_SECONDS,
} from '@/src/domain/recordedPracticeSession';
import { adoptLocalRecording, deleteLocalRecording } from '@/src/services/localRecordingFiles';
import { useActivePracticeSession } from '@/src/providers/ActivePracticeSessionProvider';
import {
  appendPoseBenchmarkRun,
  clearPoseBenchmarkRuns,
  readPoseBenchmarkRuns,
  updatePoseBenchmarkRun,
} from '@/src/services/poseBenchmarkRepository';
import { extractPoseFromVideo, PoseExtractionOutcome } from '@/src/services/poseEstimationService';
import { colors, radius, shadows } from '@/src/theme';

const issueLabels = {
  'processing-failed': 'Vision could not process enough frames',
  'insufficient-frames': 'Clip is too short',
  'person-not-found': 'No player found',
  'multiple-people': 'Another player enters too many frames',
  'tracking-lost': 'Tracking drops too often',
  'body-not-fully-visible': 'Key joints leave frame',
  'subject-too-small': 'Player is too small in frame',
};

type BenchmarkClip = {
  uri: string;
  duration?: number | null;
  fileSize?: number;
  height?: number;
  width?: number;
  source: 'guided-camera' | 'photo-library';
};

type PoseLabRouteParams = {
  benchmarkCaseId?: string | string[];
  sessionId?: string | string[];
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatBytes(value?: number) {
  if (!value || value <= 0) return 'size unavailable';
  const megabytes = value / 1_048_576;
  return megabytes >= 1 ? `${megabytes.toFixed(1)} MB` : `${Math.round(value / 1024)} KB`;
}

function formatRuntime(milliseconds: number) {
  return milliseconds < 1000
    ? `${milliseconds} ms`
    : `${(milliseconds / 1000).toFixed(1)} sec`;
}

function formatDelta(value: number) {
  const points = Math.round(value * 100);
  if (points === 0) return 'no change';
  return `${points > 0 ? '+' : ''}${points} pts`;
}

export default function PoseLabScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<PoseLabRouteParams>();
  const { activeSession, discardSession, releaseSession } = useActivePracticeSession();
  const requestedCaseId = firstParam(params.benchmarkCaseId);
  const requestedSessionId = firstParam(params.sessionId);
  const requestedCase = isPoseBenchmarkCaseId(requestedCaseId)
    ? getPoseBenchmarkCase(requestedCaseId)
    : null;
  const [practiceType, setPracticeType] = useState<PracticeType>('serve');
  const [benchmarkCaseId, setBenchmarkCaseId] = useState<PoseBenchmarkCaseId>('S01');
  const [asset, setAsset] = useState<BenchmarkClip | null>(null);
  const [clipFingerprint, setClipFingerprint] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<PoseExtractionOutcome | null>(null);
  const [currentRun, setCurrentRun] = useState<PoseBenchmarkRun | null>(null);
  const [previousRun, setPreviousRun] = useState<PoseBenchmarkRun | null>(null);
  const [runs, setRuns] = useState<PoseBenchmarkRun[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isPicking, setIsPicking] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canOpenSettings, setCanOpenSettings] = useState(false);
  const consumedSessionRef = useRef<string | null>(null);
  const isAnalyzingRef = useRef(false);
  const isMountedRef = useRef(true);
  const analysisRequestRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      analysisRequestRef.current += 1;
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    void readPoseBenchmarkRuns().then((storedRuns) => {
      if (isActive) {
        setRuns(storedRuns);
        if (requestedCase) {
          setPracticeType(requestedCase.practiceType);
          setBenchmarkCaseId(requestedCase.id);
        } else {
          const nextCase = getNextUnqualifiedPoseBenchmarkCase(storedRuns);
          if (nextCase) {
            setPracticeType(nextCase.practiceType);
            setBenchmarkCaseId(nextCase.id);
          }
        }
        setIsLoadingHistory(false);
      }
    });
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(
    () => () => {
      if (asset) void deleteLocalRecording(asset.uri);
    },
    [asset],
  );

  const comparison = useMemo(
    () => currentRun && previousRun ? compareBenchmarkRuns(currentRun, previousRun) : null,
    [currentRun, previousRun],
  );
  const currentRunQualifies = useMemo(
    () => currentRun ? isPoseBenchmarkRunQualified(currentRun, runs) : false,
    [currentRun, runs],
  );
  const nextCase = useMemo(
    () => currentRunQualifies && currentRun?.benchmarkCaseId
      ? getNextUnqualifiedPoseBenchmarkCase(runs, currentRun.benchmarkCaseId)
      : null,
    [currentRunQualifies, currentRun?.benchmarkCaseId, runs],
  );

  const runAnalysis = useCallback(async (
    nextAsset: BenchmarkClip,
    fingerprint: string,
    selectedPracticeType: PracticeType,
    selectedCaseId: PoseBenchmarkCaseId,
  ) => {
    if (isAnalyzingRef.current) return;
    const requestId = analysisRequestRef.current + 1;
    analysisRequestRef.current = requestId;
    isAnalyzingRef.current = true;
    setIsAnalyzing(true);
    setError(null);
    setCanOpenSettings(false);
    setOutcome(null);
    setCurrentRun(null);
    setPreviousRun(null);

    try {
      const nextOutcome = await extractPoseFromVideo(nextAsset.uri);
      if (!isMountedRef.current || analysisRequestRef.current !== requestId) return;
      setOutcome(nextOutcome);

      if (nextOutcome.status === 'success') {
        const run = benchmarkRunFromResult({
          benchmarkCaseId: selectedCaseId,
          clipFingerprint: fingerprint,
          device: {
            modelName: Device.modelName ?? 'Unknown Apple device',
            osName: Device.osName ?? 'iOS',
            osVersion: Device.osVersion ?? 'Unknown version',
            isPhysicalDevice: Device.isDevice,
          },
          practiceType: selectedPracticeType,
          result: nextOutcome.result,
          runtimeMilliseconds: nextOutcome.runtimeMilliseconds,
        });
        const prior = runs.find((item) => (
          item.clipFingerprint === fingerprint &&
          item.practiceType === selectedPracticeType &&
          item.benchmarkCaseId === selectedCaseId
        )) ?? null;
        const nextRuns = await appendPoseBenchmarkRun(run);
        if (!isMountedRef.current || analysisRequestRef.current !== requestId) return;
        setPreviousRun(prior);
        setCurrentRun(run);
        setRuns(nextRuns);
      }
    } catch (analysisError) {
      if (!isMountedRef.current || analysisRequestRef.current !== requestId) return;
      console.warn('Pose lab could not save this benchmark run.', analysisError);
      setError('Tracking finished, but this benchmark run could not be saved. Try it again.');
    } finally {
      if (isMountedRef.current && analysisRequestRef.current === requestId) {
        isAnalyzingRef.current = false;
        setIsAnalyzing(false);
      }
    }
  }, [runs]);

  useEffect(() => {
    if (isLoadingHistory || !requestedSessionId) return;
    if (consumedSessionRef.current === requestedSessionId) return;

    if (!requestedCase) {
      consumedSessionRef.current = requestedSessionId;
      if (activeSession) {
        void discardSession(activeSession.id);
      }
      setError('This benchmark handoff was invalid. Choose a case and record it again.');
      return;
    }

    if (!activeSession || activeSession.id !== requestedSessionId) {
      if (activeSession) {
        void discardSession(activeSession.id);
      }
      setError('This benchmark recording is no longer available. Record the selected case again.');
      return;
    }

    consumedSessionRef.current = requestedSessionId;
    if (activeSession.practiceType !== requestedCase.practiceType) {
      void discardSession(activeSession.id);
      setError('The recorded skill did not match this benchmark case. Record the case again.');
      return;
    }

    const recordedAsset: BenchmarkClip = {
      duration: activeSession.duration * 1000,
      source: 'guided-camera',
      uri: activeSession.videoUri,
    };
    const fingerprint = createRecordedSessionClipFingerprint(activeSession);
    setPracticeType(requestedCase.practiceType);
    setBenchmarkCaseId(requestedCase.id);
    setAsset(recordedAsset);
    setClipFingerprint(fingerprint);
    releaseSession(activeSession.id);
    void runAnalysis(recordedAsset, fingerprint, requestedCase.practiceType, requestedCase.id);
  }, [
    activeSession,
    discardSession,
    isLoadingHistory,
    releaseSession,
    requestedCase,
    requestedSessionId,
    runAnalysis,
  ]);

  if (!isPoseLabEnabled) {
    return <Redirect href="/(tabs)/profile" />;
  }

  const selectPractice = (type: PracticeType) => {
    if (isAnalyzing || type === practiceType) return;
    const cases = getPoseBenchmarkCasesForPractice(type);
    const nextCaseForPractice = cases.find(
      (item) => assessPoseBenchmarkCase(item.id, runs).status !== 'qualified',
    ) ?? cases[0];
    setPracticeType(type);
    setBenchmarkCaseId(nextCaseForPractice.id);
    setAsset(null);
    setClipFingerprint(null);
    setOutcome(null);
    setCurrentRun(null);
    setPreviousRun(null);
  };

  const selectBenchmarkCase = (caseId: PoseBenchmarkCaseId) => {
    if (isAnalyzing || caseId === benchmarkCaseId) return;
    const preservesExactRerun = benchmarkCaseId === 'S01' && caseId === 'S02';
    setBenchmarkCaseId(caseId);
    if (!preservesExactRerun) {
      setAsset(null);
      setClipFingerprint(null);
    }
    setOutcome(null);
    setCurrentRun(null);
    setPreviousRun(null);
  };

  const continueBenchmark = () => {
    if (!currentRun?.benchmarkCaseId || !nextCase) return;
    const reusesExactSource = currentRun.benchmarkCaseId === 'S01' && nextCase.id === 'S02';
    const reusableAsset = reusesExactSource ? asset : null;
    const reusableFingerprint = reusesExactSource ? clipFingerprint : null;

    setPracticeType(nextCase.practiceType);
    setBenchmarkCaseId(nextCase.id);
    setOutcome(null);
    setCurrentRun(null);
    setPreviousRun(null);

    if (reusableAsset && reusableFingerprint) {
      void runAnalysis(reusableAsset, reusableFingerprint, nextCase.practiceType, nextCase.id);
    } else {
      setAsset(null);
      setClipFingerprint(null);
    }
  };

  const chooseClip = async () => {
    if (isPicking || isAnalyzing) return;
    setIsPicking(true);
    setError(null);
    setCanOpenSettings(false);

    let transientAssetUri: string | null = null;
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError(permission.canAskAgain
          ? 'Photo-library access is needed to choose a controlled video.'
          : 'Allow Photos access in Settings to import a controlled video.');
        setCanOpenSettings(!permission.canAskAgain);
        return;
      }

      const selection = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        allowsMultipleSelection: false,
        mediaTypes: ['videos'],
        preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
        quality: 1,
      });
      if (selection.canceled) return;

      const nextAsset = selection.assets[0];
      transientAssetUri = nextAsset?.uri ?? null;
      if (!nextAsset || (nextAsset.type && nextAsset.type !== 'video')) {
        setError('Choose a regular video clip to run this benchmark.');
        if (transientAssetUri) await deleteLocalRecording(transientAssetUri);
        transientAssetUri = null;
        return;
      }

      const durationSeconds = (nextAsset.duration ?? 0) / 1000;
      if (durationSeconds > MAX_RECORDING_DURATION_SECONDS + 0.5) {
        setError('Choose a clip that is 30 seconds or shorter so it matches the practice flow.');
        await deleteLocalRecording(nextAsset.uri);
        transientAssetUri = null;
        return;
      }

      const fingerprint = createClipFingerprint(nextAsset);
      const managedAsset: BenchmarkClip = {
        duration: nextAsset.duration,
        fileSize: nextAsset.fileSize,
        height: nextAsset.height,
        source: 'photo-library',
        uri: await adoptLocalRecording(nextAsset.uri),
        width: nextAsset.width,
      };
      setAsset(managedAsset);
      setClipFingerprint(fingerprint);
      transientAssetUri = null;
      await runAnalysis(managedAsset, fingerprint, practiceType, benchmarkCaseId);
    } catch (selectionError) {
      console.warn('Pose lab could not choose a clip.', selectionError);
      setError('The clip could not be opened. Try exporting it to Photos and choose it again.');
      if (transientAssetUri) await deleteLocalRecording(transientAssetUri);
    } finally {
      setIsPicking(false);
    }
  };

  const saveVisualReview = async (
    review: 'clean' | 'needs-review',
    issues: PoseBenchmarkVisualIssue[],
  ) => {
    if (!currentRun || isSavingReview) return;
    setIsSavingReview(true);
    setError(null);
    try {
      const reviewedRun = withBenchmarkVisualReview(currentRun, review, issues);
      const nextRuns = await updatePoseBenchmarkRun(reviewedRun);
      setCurrentRun(reviewedRun);
      setRuns(nextRuns);
    } catch (reviewError) {
      console.warn('Pose benchmark visual review could not be saved.', reviewError);
      setError('The visual review could not be saved on this iPhone. Please try again.');
    } finally {
      setIsSavingReview(false);
    }
  };

  const shareReport = async () => {
    if (!runs.length) return;
    try {
      await Share.share({
        message: buildPoseBenchmarkReport(runs),
        title: 'PickleCoach pose benchmark',
      });
    } catch (shareError) {
      console.warn('Pose benchmark report could not be shared.', shareError);
      setError('The benchmark report could not be shared. Please try again.');
    }
  };

  const clearHistory = () => {
    if (isAnalyzing || isSavingReview) return;
    Alert.alert(
      'Clear benchmark history?',
      'This removes saved quality summaries. Temporary imported copies are deleted when replaced or when you leave the lab.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear summaries',
          style: 'destructive',
          onPress: () => {
            void clearPoseBenchmarkRuns().then(() => {
              setRuns([]);
              setCurrentRun(null);
              setPreviousRun(null);
            }).catch((clearError) => {
              console.warn('Pose benchmark history could not be cleared.', clearError);
              setError('The saved benchmark summaries could not be cleared. Please try again.');
            });
          },
        },
      ],
    );
  };

  const trackedResult = outcome?.status === 'success' ? outcome.result : null;
  const assetDuration = asset?.duration
    ? asset.duration / 1000
    : trackedResult?.video.duration ?? 0;
  const assetWidth = asset?.width ?? trackedResult?.video.width;
  const assetHeight = asset?.height ?? trackedResult?.video.height;
  const assetDetails = asset
    ? [
        formatRecordingDuration(assetDuration),
        assetWidth && assetHeight ? `${Math.round(assetWidth)}×${Math.round(assetHeight)}` : null,
        asset.fileSize ? formatBytes(asset.fileSize) : null,
        asset.source === 'guided-camera' ? 'guided camera' : 'Photos import',
      ].filter(Boolean).join(' · ')
    : '';

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {isAnalyzing ? <PoseProcessingKeepAwake /> : null}
      <Stack.Screen options={{ title: 'Pose lab' }} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Tag tone="coral">INTERNAL TOOL</Tag>
          <Text style={styles.title}>Make the skeleton prove itself.</Text>
          <Text style={styles.subtitle}>Record the selected case here—or import an existing clip—then inspect the full overlay. No technique score is created.</Text>
        </View>

        {!isLoadingHistory ? <BenchmarkProgress onShare={() => void shareReport()} runs={runs} /> : null}

        <View style={styles.practiceSelector}>
          {practiceTypes.map((type) => {
            const selected = practiceType === type;
            return (
              <Pressable
                key={type}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                disabled={isAnalyzing}
                onPress={() => selectPractice(type)}
                style={({ pressed }) => [
                  styles.practiceOption,
                  selected && styles.practiceOptionSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.practiceLabel, selected && styles.practiceLabelSelected]}>{practices[type].title}</Text>
              </Pressable>
            );
          })}
        </View>

        <BenchmarkCasePicker
          disabled={isAnalyzing}
          practiceType={practiceType}
          runs={runs}
          selectedCaseId={benchmarkCaseId}
          onSelect={selectBenchmarkCase}
        />

        <Card style={styles.importCard}>
          <View style={styles.importIcon}>
            <AppIcon color={colors.primary} name={asset ? 'film-outline' : 'camera-outline'} size={30} />
          </View>
          <View style={styles.importCopy}>
            <Text style={styles.importTitle}>{asset ? 'Controlled clip loaded' : `Capture ${benchmarkCaseId} on this iPhone`}</Text>
            <Text style={styles.importBody}>
              {asset
                ? assetDetails
                : 'The guided camera returns here and starts landmark tracking automatically. The video stays local.'}
            </Text>
          </View>
          <Button
            disabled={isPicking || isAnalyzing}
            icon="camera"
            label={asset ? `Record a new ${benchmarkCaseId}` : `Record ${benchmarkCaseId}`}
            onPress={() => router.push({
              pathname: '/record/[shot]',
              params: { benchmarkCaseId, shot: practiceType },
            })}
          />
          <Button
            disabled={isPicking || isAnalyzing}
            icon={asset ? 'swap-horizontal' : 'folder-open-outline'}
            label={asset ? 'Replace from Photos' : 'Choose existing video'}
            onPress={() => void chooseClip()}
            variant="secondary"
          />
        </Card>

        {asset && !outcome && !isAnalyzing ? (
          <Button
            icon="play"
            label={`Run ${benchmarkCaseId} with loaded clip`}
            onPress={() => {
              if (clipFingerprint) {
                void runAnalysis(asset, clipFingerprint, practiceType, benchmarkCaseId);
              }
            }}
          />
        ) : null}

        {error ? (
          <View style={styles.errorCard}>
            <AppIcon color={colors.danger} name="alert-circle-outline" size={21} />
            <Text style={styles.errorText}>{error}</Text>
            {canOpenSettings ? (
              <Pressable accessibilityRole="button" onPress={() => void Linking.openSettings()}>
                <Text style={styles.settingsLink}>Settings</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {isAnalyzing ? (
          <Card style={styles.processingCard}>
            <ActivityIndicator color={colors.primaryBright} size="large" />
            <Text style={styles.processingTitle}>Tracking every sampled frame…</Text>
            <Text style={styles.processingBody}>Apple Vision is running on this iPhone. Longer clips can take a moment.</Text>
          </Card>
        ) : null}

        {!isAnalyzing && outcome?.status === 'unsupported' ? (
          <Card style={styles.messageCard}>
            <Text style={styles.messageTitle}>Latest iPhone build needed</Text>
            <Text style={styles.messageBody}>{outcome.message}</Text>
          </Card>
        ) : null}

        {!isAnalyzing && outcome?.status === 'error' ? (
          <Card style={styles.messageCard}>
            <Text style={styles.messageTitle}>Tracking did not finish</Text>
            <Text style={styles.messageBody}>{outcome.message}</Text>
            <Text style={styles.runtimeNote}>Stopped after {formatRuntime(outcome.runtimeMilliseconds)}</Text>
          </Card>
        ) : null}

        {!isAnalyzing && outcome?.status === 'success' ? (
          <>
            <Card style={outcome.result.quality.status === 'usable' ? styles.passCard : styles.retakeCard}>
              <View style={styles.resultHeading}>
                <View style={styles.resultIcon}>
                  <AppIcon
                    color={outcome.result.quality.status === 'usable' ? colors.primary : colors.warning}
                    name={outcome.result.quality.status === 'usable' ? 'checkmark' : 'refresh'}
                    size={23}
                  />
                </View>
                <View style={styles.resultCopy}>
                  <Text style={styles.resultEyebrow}>QUALITY DECISION</Text>
                  <Text style={styles.resultTitle}>{outcome.result.quality.status === 'usable' ? 'Usable for landmark study' : 'Retake this clip'}</Text>
                  <Text style={styles.resultBody}>{outcome.result.quality.message}</Text>
                </View>
                <Tag tone={outcome.result.quality.status === 'usable' ? 'green' : 'coral'}>
                  {outcome.result.quality.status.toUpperCase()}
                </Tag>
              </View>

              <View style={styles.metricGrid}>
                <Metric label="BODY FRAMES" value={formatPosePercentage(outcome.result.quality.poseCoverage)} />
                <Metric label="KEY JOINTS" value={formatPosePercentage(outcome.result.quality.keyJointCoverage)} />
                <Metric label="CONFIDENCE" value={formatPosePercentage(outcome.result.quality.averageConfidence)} />
                <Metric label="RUNTIME" value={formatRuntime(outcome.runtimeMilliseconds)} />
              </View>

              {outcome.result.quality.issues.length ? (
                <View style={styles.issueList}>
                  {outcome.result.quality.issues.map((issue) => (
                    <View key={issue} style={styles.issueRow}>
                      <AppIcon color={colors.warning} name="warning-outline" size={16} />
                      <Text style={styles.issueText}>{issueLabels[issue]}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </Card>

            <PoseTrackingPreview
              inspectionMode
              result={outcome.result}
              videoUri={asset?.uri ?? ''}
            />

            {currentRun ? (
              <BenchmarkVisualReview
                isSaving={isSavingReview}
                run={currentRun}
                onSave={saveVisualReview}
              />
            ) : null}

            {currentRunQualifies ? (
              <Card style={styles.nextCaseCard}>
                <View style={styles.nextCaseIcon}>
                  <AppIcon color={colors.primary} name="checkmark" size={22} />
                </View>
                <View style={styles.nextCaseCopy}>
                  <Text style={styles.nextCaseEyebrow}>CASE QUALIFIED</Text>
                  <Text style={styles.nextCaseTitle}>
                    {nextCase ? `${nextCase.id} is ready next` : 'The full matrix is qualified'}
                  </Text>
                  <Text style={styles.nextCaseBody}>
                    {nextCase
                      ? currentRun?.benchmarkCaseId === 'S01' && nextCase.id === 'S02'
                        ? 'The exact loaded clip will rerun automatically for the stability check.'
                        : nextCase.detail
                      : 'Share the privacy-safe report for the measurement decision.'}
                  </Text>
                </View>
                {nextCase ? (
                  <Button
                    icon={currentRun?.benchmarkCaseId === 'S01' && nextCase.id === 'S02' ? 'repeat' : 'arrow-forward'}
                    label={currentRun?.benchmarkCaseId === 'S01' && nextCase.id === 'S02'
                      ? 'Run exact clip again'
                      : `Set up ${nextCase.id}`}
                    onPress={continueBenchmark}
                    variant="secondary"
                  />
                ) : (
                  <Button icon="share-outline" label="Share final report" onPress={() => void shareReport()} variant="secondary" />
                )}
              </Card>
            ) : null}

            {comparison ? (
              <Card style={styles.comparisonCard}>
                <View style={styles.comparisonHeading}>
                  <View>
                    <Text style={styles.resultEyebrow}>REPEATABILITY</Text>
                    <Text style={styles.comparisonTitle}>{comparison.decisionStable ? 'Same quality decision' : 'Decision changed'}</Text>
                  </View>
                  <Tag tone={comparison.decisionStable ? 'green' : 'coral'}>
                    {comparison.decisionStable ? 'STABLE' : 'REVIEW'}
                  </Tag>
                </View>
                <Text style={styles.comparisonBody}>Body coverage {formatDelta(comparison.poseCoverageDelta)} · key joints {formatDelta(comparison.keyJointCoverageDelta)} · runtime {comparison.runtimeDeltaMilliseconds > 0 ? '+' : ''}{formatRuntime(Math.abs(comparison.runtimeDeltaMilliseconds))}</Text>
              </Card>
            ) : (
              <Text style={styles.repeatHint}>Run this exact clip again to create a stability comparison.</Text>
            )}

            <Button
              disabled={!asset || !clipFingerprint}
              icon="repeat"
              label="Run the same clip again"
              onPress={() => {
                if (asset && clipFingerprint) {
                  void runAnalysis(
                    asset,
                    clipFingerprint,
                    currentRun?.practiceType ?? practiceType,
                    currentRun?.benchmarkCaseId ?? benchmarkCaseId,
                  );
                }
              }}
            />
          </>
        ) : null}

        <View style={styles.historySection}>
          <View style={styles.historyHeading}>
            <View>
              <Text style={styles.historyEyebrow}>LOCAL BENCHMARK LOG</Text>
              <Text style={styles.historyTitle}>Recent runs</Text>
            </View>
            {runs.length ? (
              <Pressable
                accessibilityRole="button"
                disabled={isAnalyzing || isSavingReview}
                onPress={clearHistory}
                style={(state) => (state.pressed || isAnalyzing || isSavingReview) && styles.pressed}
              >
                <Text style={styles.clearText}>Clear</Text>
              </Pressable>
            ) : null}
          </View>

          {isLoadingHistory ? (
            <ActivityIndicator color={colors.primary} />
          ) : runs.length ? (
            <View style={styles.historyList}>
              {runs.slice(0, 12).map((run) => (
                <Card key={run.id} style={styles.historyCard}>
                  <View style={[styles.historyDot, run.status === 'retake' && styles.historyDotRetake]} />
                  <View style={styles.historyCopy}>
                    <Text style={styles.historyRunTitle}>{run.benchmarkCaseId ?? 'Unassigned'} · {practices[run.practiceType].title} · {run.status === 'usable' ? 'usable' : 'retake'}</Text>
                    <Text style={styles.historyMeta}>{formatPosePercentage(run.poseCoverage)} body · {formatPosePercentage(run.keyJointCoverage)} joints · {run.visualReview === 'clean' ? 'visually clean' : run.visualReview === 'needs-review' ? 'flagged' : 'review pending'}</Text>
                  </View>
                  <Text style={styles.historyDate}>{new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(run.analyzedAt))}</Text>
                </Card>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyHistory}>Quality summaries appear here after the first controlled clip. No video URI or landmark frames are saved.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { padding: 18, paddingBottom: 44, gap: 16 },
  hero: { gap: 9, paddingHorizontal: 2, paddingTop: 4, paddingBottom: 4 },
  title: { color: colors.text, fontSize: 38, lineHeight: 41, fontWeight: '900', letterSpacing: -1.45, maxWidth: 360 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, maxWidth: 370 },
  practiceSelector: { flexDirection: 'row', gap: 8, padding: 5, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted },
  practiceOption: { flex: 1, minHeight: 42, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  practiceOptionSelected: { backgroundColor: colors.surface, ...shadows.card },
  practiceLabel: { color: colors.muted, fontSize: 13, fontWeight: '800' },
  practiceLabelSelected: { color: colors.text },
  importCard: { gap: 13, alignItems: 'stretch' },
  importIcon: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  importCopy: { gap: 5 },
  importTitle: { color: colors.text, fontSize: 21, fontWeight: '900', letterSpacing: -0.45 },
  importBody: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  errorCard: { minHeight: 62, borderRadius: radius.md, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: colors.dangerSoft },
  errorText: { flex: 1, color: colors.danger, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  settingsLink: { color: colors.danger, fontSize: 12, fontWeight: '900', textDecorationLine: 'underline' },
  processingCard: { minHeight: 210, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.primaryMist },
  processingTitle: { color: colors.text, fontSize: 21, fontWeight: '900', marginTop: 5 },
  processingBody: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', maxWidth: 280 },
  messageCard: { gap: 7, backgroundColor: colors.warningSoft },
  messageTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  messageBody: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  runtimeNote: { color: colors.subtle, fontSize: 10, fontWeight: '800' },
  passCard: { gap: 16, backgroundColor: colors.primaryMist },
  retakeCard: { gap: 16, backgroundColor: colors.warningSoft },
  resultHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  resultIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  resultCopy: { flex: 1, gap: 3 },
  resultEyebrow: { color: colors.primary, fontSize: 8, fontWeight: '900', letterSpacing: 0.85 },
  resultTitle: { color: colors.text, fontSize: 18, lineHeight: 22, fontWeight: '900' },
  resultBody: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metric: { width: '48%', minHeight: 78, borderRadius: radius.sm, padding: 12, justifyContent: 'flex-end', gap: 3, backgroundColor: colors.surface },
  metricValue: { color: colors.text, fontSize: 19, fontWeight: '900', letterSpacing: -0.35 },
  metricLabel: { color: colors.subtle, fontSize: 8, fontWeight: '900', letterSpacing: 0.55 },
  issueList: { gap: 7 },
  issueRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  issueText: { color: colors.warning, fontSize: 12, fontWeight: '800' },
  comparisonCard: { gap: 10, backgroundColor: colors.blueSoft },
  comparisonHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  comparisonTitle: { color: colors.text, fontSize: 19, fontWeight: '900', marginTop: 3 },
  comparisonBody: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  nextCaseCard: { gap: 11, backgroundColor: colors.primaryMist },
  nextCaseIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  nextCaseCopy: { gap: 3 },
  nextCaseEyebrow: { color: colors.primary, fontSize: 8, fontWeight: '900', letterSpacing: 0.85 },
  nextCaseTitle: { color: colors.text, fontSize: 19, lineHeight: 23, fontWeight: '900' },
  nextCaseBody: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  repeatHint: { color: colors.subtle, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  historySection: { gap: 12, marginTop: 8 },
  historyHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  historyEyebrow: { color: colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  historyTitle: { color: colors.text, fontSize: 25, fontWeight: '900', letterSpacing: -0.6, marginTop: 3 },
  clearText: { color: colors.danger, fontSize: 12, fontWeight: '900', padding: 8 },
  historyList: { gap: 8 },
  historyCard: { minHeight: 72, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primaryBright },
  historyDotRetake: { backgroundColor: colors.coral },
  historyCopy: { flex: 1, gap: 3 },
  historyRunTitle: { color: colors.text, fontSize: 13, fontWeight: '900' },
  historyMeta: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  historyDate: { color: colors.subtle, fontSize: 10, fontWeight: '700' },
  emptyHistory: { color: colors.subtle, fontSize: 12, lineHeight: 18, paddingHorizontal: 3 },
  pressed: { opacity: 0.68 },
});
