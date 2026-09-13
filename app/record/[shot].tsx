import { useCameraPermissions } from 'expo-camera';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, BackHandler } from 'react-native';
import { CameraPermissionGate } from '@/src/components/practice/CameraPermissionGate';
import { CameraSetup } from '@/src/components/practice/CameraSetup';
import { CameraUnavailable } from '@/src/components/practice/CameraUnavailable';
import { PracticeCamera } from '@/src/components/practice/PracticeCamera';
import { RecordingReview } from '@/src/components/practice/RecordingReview';
import { isPoseLabEnabled } from '@/src/config/featureFlags';
import { practices } from '@/src/data/practices';
import { toPoseBenchmarkRouteParams } from '@/src/domain/poseBenchmark';
import { getPoseBenchmarkCase, isPoseBenchmarkCaseId } from '@/src/domain/poseBenchmarkProtocol';
import { isPracticeType } from '@/src/domain/practice';
import {
  createRecordedPracticeSession,
  RecordedPracticeSession,
  toAnalysisRouteParams,
} from '@/src/domain/recordedPracticeSession';
import { deleteLocalRecording } from '@/src/services/localRecordingFiles';
import { useActivePracticeSession } from '@/src/providers/ActivePracticeSessionProvider';
import { colors } from '@/src/theme';

type CapturePhase = 'setup' | 'permissions' | 'camera' | 'review';
type CameraAvailability = 'idle' | 'checking' | 'available' | 'unavailable';

export default function RecordScreen() {
  const router = useRouter();
  const { activateSession } = useActivePracticeSession();
  const { benchmarkCaseId: rawBenchmarkCaseId, shot: rawShot } = useLocalSearchParams<{
    benchmarkCaseId?: string | string[];
    shot?: string | string[];
  }>();
  const shotParam = Array.isArray(rawShot) ? rawShot[0] : rawShot;
  const benchmarkCaseIdParam = Array.isArray(rawBenchmarkCaseId)
    ? rawBenchmarkCaseId[0]
    : rawBenchmarkCaseId;
  const practiceType = isPracticeType(shotParam) ? shotParam : 'serve';
  const practice = practices[practiceType];
  const requestedBenchmarkCase = isPoseBenchmarkCaseId(benchmarkCaseIdParam)
    ? getPoseBenchmarkCase(benchmarkCaseIdParam)
    : null;
  const benchmarkCase = isPoseLabEnabled && requestedBenchmarkCase?.practiceType === practiceType
    ? requestedBenchmarkCase
    : null;

  const [cameraPermission, requestCameraPermission, refreshCameraPermission] =
    useCameraPermissions();
  const [phase, setPhase] = useState<CapturePhase>('setup');
  const [cameraAvailability, setCameraAvailability] = useState<CameraAvailability>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);
  const [session, setSession] = useState<RecordedPracticeSession | null>(null);

  const sessionRef = useRef<RecordedPracticeSession | null>(null);
  const didHandoffRef = useRef(false);
  const isRequestingPermissionsRef = useRef(false);
  const isMountedRef = useRef(true);

  const prepareCamera = useCallback(() => {
    setPhase('camera');
    setCameraAvailability('available');
    setCameraError(null);
  }, []);

  const requestPermissions = useCallback(async () => {
    if (isRequestingPermissionsRef.current) {
      return;
    }

    isRequestingPermissionsRef.current = true;
    setIsRequestingPermissions(true);
    setPermissionError(null);

    try {
      const nextCameraPermission = cameraPermission?.granted
        ? cameraPermission
        : await requestCameraPermission();

      if (!nextCameraPermission.granted) {
        return;
      }

      await prepareCamera();
    } catch (error) {
      console.warn('Camera permission request failed.', error);
      if (isMountedRef.current) {
        setPermissionError('We could not request access. Please try again or check device Settings.');
      }
    } finally {
      isRequestingPermissionsRef.current = false;
      if (isMountedRef.current) {
        setIsRequestingPermissions(false);
      }
    }
  }, [
    cameraPermission,
    prepareCamera,
    requestCameraPermission,
  ]);

  const discardSession = useCallback(async () => {
    const previousSession = sessionRef.current;
    sessionRef.current = null;
    setSession(null);

    if (previousSession) {
      await deleteLocalRecording(previousSession.videoUri);
    }
  }, []);

  const handleRecorded = useCallback(
    ({ videoUri, duration }: { videoUri: string; duration: number }) => {
      const recordedSession = createRecordedPracticeSession({
        practiceType,
        videoUri,
        duration,
      });

      sessionRef.current = recordedSession;
      setSession(recordedSession);
      setPhase('review');
    },
    [practiceType],
  );

  const handleRetake = useCallback(async () => {
    await discardSession();
    setPhase('camera');
    setCameraAvailability('available');
  }, [discardSession]);

  const handleCancelReview = useCallback(async () => {
    await discardSession();
    setPhase('setup');
  }, [discardSession]);

  const handleUseVideo = useCallback(() => {
    const recordedSession = sessionRef.current;

    if (!recordedSession || didHandoffRef.current) {
      return;
    }

    activateSession(recordedSession);
    didHandoffRef.current = true;
    if (benchmarkCase) {
      // Return to the mounted lab so repeated captures do not stack duplicate
      // Pose Lab screens (and duplicate owners of temporary video files).
      router.dismissTo({
        pathname: '/dev/pose-lab',
        params: toPoseBenchmarkRouteParams(recordedSession, benchmarkCase.id),
      });
    } else {
      router.replace({
        pathname: '/analysis/[shot]',
        params: toAnalysisRouteParams(recordedSession),
      });
    }
  }, [activateSession, benchmarkCase, router]);

  useEffect(() => {
    if (
      phase === 'permissions' &&
      cameraPermission?.granted
    ) {
      void prepareCamera();
    }
  }, [cameraPermission?.granted, phase, prepareCamera]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && phase === 'permissions') {
        void refreshCameraPermission();
      }
    });

    return () => subscription.remove();
  }, [phase, refreshCameraPermission]);

  useEffect(() => {
    const shouldHandleBack =
      phase === 'permissions' || (phase === 'camera' && cameraAvailability !== 'available');

    if (!shouldHandleBack) {
      return;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setPhase('setup');
      return true;
    });

    return () => subscription.remove();
  }, [cameraAvailability, phase]);

  useEffect(
    () => {
      isMountedRef.current = true;

      return () => {
        isMountedRef.current = false;
        const pendingSession = sessionRef.current;

        if (pendingSession && !didHandoffRef.current) {
          void deleteLocalRecording(pendingSession.videoUri);
        }
      };
    },
    [],
  );

  const screenOptions = {
    contentStyle: {
      backgroundColor: phase === 'setup' ? colors.background : '#070A08',
    },
    gestureEnabled: phase === 'setup',
    headerShown: phase === 'setup',
    title: benchmarkCase ? 'Benchmark capture' : 'Practice setup',
  };

  if (phase === 'setup') {
    return (
      <>
        <Stack.Screen options={screenOptions} />
        <StatusBar style="dark" />
        <CameraSetup
          benchmarkCase={benchmarkCase ?? undefined}
          practice={practice}
          practiceType={practiceType}
          onContinue={() => setPhase('permissions')}
        />
      </>
    );
  }

  if (phase === 'permissions') {
    return (
      <>
        <Stack.Screen options={screenOptions} />
        <StatusBar style="dark" />
        <CameraPermissionGate
          cameraPermission={cameraPermission}
          isRequesting={isRequestingPermissions}
          requestError={permissionError}
          onBack={() => setPhase('setup')}
          onRequest={() => void requestPermissions()}
        />
      </>
    );
  }

  if (phase === 'camera' && cameraAvailability !== 'available') {
    return (
      <>
        <Stack.Screen options={screenOptions} />
        <StatusBar style="dark" />
        <CameraUnavailable
          detail={cameraError ?? undefined}
          isChecking={cameraAvailability === 'checking'}
          onBack={() => setPhase('setup')}
          onRetry={() => void prepareCamera()}
        />
      </>
    );
  }

  if (phase === 'camera') {
    return (
      <>
        <Stack.Screen options={screenOptions} />
        <StatusBar style="light" />
        <PracticeCamera
          contextLabel={benchmarkCase ? `${benchmarkCase.id} · TEST` : undefined}
          frameInstruction={benchmarkCase ? `FOLLOW ${benchmarkCase.id} CONDITION` : undefined}
          positionHint={benchmarkCase ? `${benchmarkCase.title} · ${benchmarkCase.detail}` : undefined}
          practice={practice}
          onCancel={() => setPhase('setup')}
          onRecorded={handleRecorded}
          onUnavailable={(message) => {
            setCameraError(message);
            setCameraAvailability('unavailable');
          }}
        />
      </>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <Stack.Screen options={screenOptions} />
      <StatusBar style="light" />
      <RecordingReview
        contextLabel={benchmarkCase ? `${benchmarkCase.id} benchmark` : undefined}
        practice={practice}
        reviewInstruction={benchmarkCase ? `${benchmarkCase.title}. ${benchmarkCase.detail}.` : undefined}
        session={session}
        onCancel={handleCancelReview}
        onRetake={handleRetake}
        onUseVideo={handleUseVideo}
      />
    </>
  );
}
