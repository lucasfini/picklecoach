import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { RecordedPracticeSession } from '@/src/domain/recordedPracticeSession';
import { purgeAbandonedLocalJsonWrites } from '@/src/services/localJsonStore';
import { deleteLocalRecording, purgeLocalRecordings } from '@/src/services/localRecordingFiles';

type ActivePracticeSessionContextValue = {
  activeSession: RecordedPracticeSession | null;
  activateSession: (session: RecordedPracticeSession) => void;
  discardSession: (sessionId: string) => Promise<void>;
  releaseSession: (sessionId: string) => void;
};

const ActivePracticeSessionContext = createContext<ActivePracticeSessionContextValue | null>(null);

/**
 * Keeps a raw-video URI out of navigation state and persistent storage. Only one
 * accepted clip can be active; replacing a stale handoff deletes its local file.
 */
export function ActivePracticeSessionProvider({ children }: PropsWithChildren) {
  const sessionRef = useRef<RecordedPracticeSession | null>(null);
  const [activeSession, setActiveSession] = useState<RecordedPracticeSession | null>(null);

  useEffect(() => {
    void Promise.allSettled([
      purgeLocalRecordings(),
      purgeAbandonedLocalJsonWrites(),
    ]).then((results) => {
      if (results.some((result) => result.status === 'rejected')) {
        console.warn('Startup local-data cleanup did not finish.');
      }
    });

    return () => {
      const abandonedSession = sessionRef.current;
      sessionRef.current = null;
      if (abandonedSession) {
        void deleteLocalRecording(abandonedSession.videoUri);
      }
    };
  }, []);

  const activateSession = useCallback((session: RecordedPracticeSession) => {
    const previousSession = sessionRef.current;
    sessionRef.current = session;
    setActiveSession(session);

    if (previousSession && previousSession.videoUri !== session.videoUri) {
      void deleteLocalRecording(previousSession.videoUri);
    }
  }, []);

  const releaseSession = useCallback((sessionId: string) => {
    if (sessionRef.current?.id !== sessionId) return;
    sessionRef.current = null;
    setActiveSession(null);
  }, []);

  const discardSession = useCallback(async (sessionId: string) => {
    const session = sessionRef.current;
    if (session?.id !== sessionId) return;
    sessionRef.current = null;
    setActiveSession(null);
    await deleteLocalRecording(session.videoUri);
  }, []);

  const value = useMemo(
    () => ({ activeSession, activateSession, discardSession, releaseSession }),
    [activeSession, activateSession, discardSession, releaseSession],
  );

  return (
    <ActivePracticeSessionContext.Provider value={value}>
      {children}
    </ActivePracticeSessionContext.Provider>
  );
}

export function useActivePracticeSession() {
  const context = useContext(ActivePracticeSessionContext);
  if (!context) {
    throw new Error('useActivePracticeSession must be used inside ActivePracticeSessionProvider.');
  }
  return context;
}
