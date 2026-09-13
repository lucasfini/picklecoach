import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, BackHandler } from 'react-native';
import { CameraPermissionGate } from '@/src/components/practice/CameraPermissionGate';
import { CameraSetup } from '@/src/components/practice/CameraSetup';
import { CameraUnavailable } from '@/src/components/practice/CameraUnavailable';
import { PracticeCamera } from '@/src/components/practice/PracticeCamera';
import { RecordingReview } from '@/src/components/practice/RecordingReview';
import { practices } from '@/src/data/practices';
import { isPracticeType } from '@/src/domain/practice';
import {
  createRecordedPracticeSession,
  RecordedPracticeSession,
  toAnalysisRouteParams,
} from '@/src/domain/recordedPracticeSession';
import { deleteLocalRecording } from '@/src/services/localRecordingFiles';
import { colors } from '@/src/theme';

type CapturePhase = 'setup' | 'permissions' | 'camera' | 'review';
type CameraAvailability = 'idle' | 'checking' | 'available' | 'unavailable';

export default function RecordScreen() {
  const router = useRouter();
  const { shot: rawShot } = useLocalSearchParams<{ shot?: string | string[] }>();
  const shotParam = Array.isArray(rawShot) ? rawShot[0] : rawShot;
  const practiceType = isPracticeType(shotParam) ? shotParam : 'serve';
  const practice = practices[practiceType];

  const [cameraPermission, requestCameraPermission, refreshCameraPermission] =
    useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission, refreshMicrophonePermission] =
    useMicrophonePermissions();
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

      const nextMicrophonePermission = microphonePermission?.granted
        ? microphonePermission
        : await requestMicrophonePermission();

      if (nextMicrophonePermission.granted) {
        await prepareCamera();
      }
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
    microphonePermission,
    prepareCamera,
    requestCameraPermission,
    requestMicrophonePermission,
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

    didHandoffRef.current = true;
    router.replace({
      pathname: '/analysis/[shot]',
      params: toAnalysisRouteParams(recordedSession),
    });
  }, [router]);

  useEffect(() => {
    if (
      phase === 'permissions' &&
      cameraPermission?.granted &&
      microphonePermission?.granted
    ) {
      void prepareCamera();
    }
  }, [cameraPermission?.granted, microphonePermission?.granted, phase, prepareCamera]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && phase === 'permissions') {
        void refreshCameraPermission();
        void refreshMicrophonePermission();
      }
    });

    return () => subscription.remove();
  }, [phase, refreshCameraPermission, refreshMicrophonePermission]);

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
    title: 'Practice setup',
  };

  if (phase === 'setup') {
    return (
      <>
        <Stack.Screen options={screenOptions} />
        <StatusBar style="dark" />
        <CameraSetup practice={practice} onContinue={() => setPhase('permissions')} />
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
          microphonePermission={microphonePermission}
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
        practice={practice}
        session={session}
        onCancel={handleCancelReview}
        onRetake={handleRetake}
        onUseVideo={handleUseVideo}
      />
    </>
  );
}
