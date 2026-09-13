import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  createPlayerProfile,
  isPlayerProfile,
  PlayerProfile,
  PlayerProfileInput,
} from '@/src/domain/playerProfile';
import { deleteLocalJson, readLocalJson, writeLocalJson } from '@/src/services/localJsonStore';

const PROFILE_STORAGE_KEY = 'player-profile';

type PlayerProfileContextValue = {
  profile: PlayerProfile | null;
  isLoading: boolean;
  saveProfile: (input: PlayerProfileInput) => Promise<void>;
  resetProfile: () => Promise<void>;
};

const PlayerProfileContext = createContext<PlayerProfileContextValue | null>(null);

export function PlayerProfileProvider({ children }: PropsWithChildren) {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    void readLocalJson<unknown>(PROFILE_STORAGE_KEY).then((storedProfile) => {
      if (isActive) {
        setProfile(isPlayerProfile(storedProfile) ? storedProfile : null);
        setIsLoading(false);
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  const saveProfile = useCallback(async (input: PlayerProfileInput) => {
    const nextProfile = createPlayerProfile(input, profile);
    const didSave = await writeLocalJson(PROFILE_STORAGE_KEY, nextProfile);
    if (!didSave) {
      throw new Error('The local player profile could not be saved.');
    }
    setProfile(nextProfile);
  }, [profile]);

  const resetProfile = useCallback(async () => {
    const didDelete = await deleteLocalJson(PROFILE_STORAGE_KEY);
    if (!didDelete) {
      throw new Error('The local player profile could not be reset.');
    }
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({ profile, isLoading, saveProfile, resetProfile }),
    [isLoading, profile, resetProfile, saveProfile],
  );

  return <PlayerProfileContext.Provider value={value}>{children}</PlayerProfileContext.Provider>;
}

export function usePlayerProfile() {
  const context = useContext(PlayerProfileContext);
  if (!context) {
    throw new Error('usePlayerProfile must be used inside PlayerProfileProvider.');
  }
  return context;
}
