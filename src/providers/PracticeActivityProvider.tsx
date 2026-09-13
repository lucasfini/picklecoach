import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  addPracticeActivity,
  isPracticeActivity,
  MAX_SAVED_PRACTICE_ACTIVITIES,
  PracticeActivity,
} from '@/src/domain/practiceActivity';
import { RecordedPracticeSession } from '@/src/domain/recordedPracticeSession';
import { deleteLocalJson, readLocalJson, writeLocalJson } from '@/src/services/localJsonStore';

const ACTIVITY_STORAGE_KEY = 'practice-activity';

type PracticeActivityContextValue = {
  activities: PracticeActivity[];
  isLoading: boolean;
  recordActivity: (session: RecordedPracticeSession) => Promise<void>;
  clearActivities: () => Promise<void>;
};

const PracticeActivityContext = createContext<PracticeActivityContextValue | null>(null);

export function PracticeActivityProvider({ children }: PropsWithChildren) {
  const [activities, setActivities] = useState<PracticeActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const activitiesRef = useRef<PracticeActivity[]>([]);
  const loadPromiseRef = useRef<Promise<void> | null>(null);
  const mutationQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let isActive = true;

    const loadPromise = readLocalJson<unknown>(ACTIVITY_STORAGE_KEY).then((storedActivities) => {
      const validActivities = Array.isArray(storedActivities)
        ? storedActivities
            .filter(isPracticeActivity)
            .sort((left, right) => Date.parse(right.capturedAt) - Date.parse(left.capturedAt))
            .slice(0, MAX_SAVED_PRACTICE_ACTIVITIES)
        : [];
      activitiesRef.current = validActivities;
      if (isActive) {
        setActivities(validActivities);
        setIsLoading(false);
      }
    });
    loadPromiseRef.current = loadPromise;

    return () => {
      isActive = false;
    };
  }, []);

  const enqueueMutation = useCallback((mutation: () => Promise<void>) => {
    const operation = mutationQueueRef.current.then(mutation, mutation);
    mutationQueueRef.current = operation.catch(() => undefined);
    return operation;
  }, []);

  const recordActivity = useCallback((session: RecordedPracticeSession) => enqueueMutation(async () => {
    await loadPromiseRef.current;
    const nextActivities = addPracticeActivity(activitiesRef.current, session);
    if (nextActivities === activitiesRef.current) return;

    const didSave = await writeLocalJson(ACTIVITY_STORAGE_KEY, nextActivities);
    if (!didSave) {
      throw new Error('The completed practice could not be added to local history.');
    }
    activitiesRef.current = nextActivities;
    setActivities(nextActivities);
  }), [enqueueMutation]);

  const clearActivities = useCallback(() => enqueueMutation(async () => {
    await loadPromiseRef.current;
    const didDelete = await deleteLocalJson(ACTIVITY_STORAGE_KEY);
    if (!didDelete) {
      throw new Error('The local practice history could not be cleared.');
    }
    activitiesRef.current = [];
    setActivities([]);
  }), [enqueueMutation]);

  const value = useMemo(
    () => ({ activities, isLoading, recordActivity, clearActivities }),
    [activities, clearActivities, isLoading, recordActivity],
  );

  return <PracticeActivityContext.Provider value={value}>{children}</PracticeActivityContext.Provider>;
}

export function usePracticeActivity() {
  const context = useContext(PracticeActivityContext);
  if (!context) {
    throw new Error('usePracticeActivity must be used inside PracticeActivityProvider.');
  }
  return context;
}
