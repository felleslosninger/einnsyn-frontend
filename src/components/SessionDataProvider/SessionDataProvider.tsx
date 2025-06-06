'use client';

import type { AuthInfo } from '@digdir/einnsyn-sdk';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import type { AuthTimestamp } from '~/actions/cookies/authCookie';
import type { Settings } from '~/actions/cookies/settingsCookie';
import { useCookie } from '~/hooks/useCookie';
import useIsChanged from '~/hooks/useIsChanged';

export type SessionData = {
  settings: Settings;
  authInfo?: AuthInfo;
};

const SessionContext = createContext<SessionData | undefined>(undefined);

// Custom hook to use the SessionContext
export function useSessionData(): SessionData {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }

  return context;
}

interface SessionProviderProps {
  children: ReactNode;
  sessionData?: SessionData;
}

export function SessionDataProvider({
  children,
  sessionData,
}: SessionProviderProps) {
  const router = useRouter();
  const timestampCookie = useCookie<AuthTimestamp>('auth-timestamp');
  const isChanged = useIsChanged([timestampCookie?.timestamp], true);

  // Refresh the context (auth info) if we have a change in the auth timestamp
  useEffect(() => {
    if (isChanged) {
      router.refresh();
    }
  });

  return (
    <SessionContext.Provider value={sessionData}>
      {children}
    </SessionContext.Provider>
  );
}
