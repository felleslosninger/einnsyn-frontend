'use client';

import type { AuthInfo } from '@digdir/einnsyn-sdk';
import { useRouter } from 'next/navigation';
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useOptimistic,
} from 'react';
import type { AuthTimestamp } from '~/actions/cookies/authCookie';
import {
  type Settings,
  updateSettingsAction,
} from '~/actions/cookies/settingsCookie';
import { useCookie } from '~/hooks/useCookie';
import useIsChanged from '~/hooks/useIsChanged';

export type SessionData = {
  settings: Settings;
  authInfo?: AuthInfo;
};

export type SessionDataWithUpdate = SessionData & {
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
};

const SessionContext = createContext<SessionDataWithUpdate | undefined>(
  undefined,
);

// Custom hook to use the SessionContext
export function useSessionData(): SessionDataWithUpdate {
  const sessionData = useContext(SessionContext);
  if (sessionData === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }

  return sessionData;
}

type SessionDataProviderProps = {
  children: ReactNode;
  sessionData: SessionData;
};

export function SessionDataProvider({
  children,
  sessionData,
}: SessionDataProviderProps) {
  const router = useRouter();
  const authTimestampCookie = useCookie<AuthTimestamp>('auth-timestamp');
  const authIsChanged = useIsChanged([authTimestampCookie?.timestamp], true);

  const [optimisticSessionData, setOptimisticSessionData] = useOptimistic<
    SessionData,
    Partial<Settings>
  >(sessionData, (currentSessionData, newSettings) => ({
    ...currentSessionData,
    settings: {
      ...currentSessionData.settings,
      ...newSettings,
    },
  }));

  // Refresh the context (auth info) if we have a change in the auth timestamp
  useEffect(() => {
    if (authIsChanged) {
      router.refresh();
    }
  });

  const updateSettings = useCallback(
    async (newSettings: Partial<Settings>) => {
      setOptimisticSessionData(newSettings);
      await updateSettingsAction(newSettings);
    },
    [setOptimisticSessionData],
  );

  const sessionDataWithUpdate = useMemo(() => {
    return {
      ...optimisticSessionData,
      updateSettings,
    };
  }, [optimisticSessionData, updateSettings]);

  // Trigger a window resize event on settings change, as this can affect the layout.
  // biome-ignore lint/correctness/useExhaustiveDependencies: Always trigger a resize event when settings change
  useEffect(() => {
    window.dispatchEvent(new Event('resize'));
  }, [sessionDataWithUpdate.settings]);

  return (
    <SessionContext.Provider value={sessionDataWithUpdate}>
      {children}
    </SessionContext.Provider>
  );
}
