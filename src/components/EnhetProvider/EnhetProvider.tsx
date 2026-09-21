'use client';

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { getEnhetIdentifier, type TrimmedEnhet } from '~/lib/enhet/enhet';
import {
  ensureFullList,
  seedEnhets,
  useEnhetStoreSnapshot,
} from './enhetStore';

type ContextValue = {
  initialEnhets: readonly TrimmedEnhet[];
};

// Only the SSR enhets; the live map lives in `./enhetStore`.
const EnhetContext = createContext<ContextValue>({ initialEnhets: [] });

type Props = {
  initialEnhets?: readonly TrimmedEnhet[];
  enhetListVersion?: string | null;
  children: ReactNode;
};

export function EnhetProvider({
  initialEnhets = [],
  enhetListVersion,
  children,
}: Props) {
  const value = useMemo(() => ({ initialEnhets }), [initialEnhets]);

  // Sync into the module store on the client so it persists across
  // provider remounts (e.g. navigation between @header pages).
  useEffect(() => {
    seedEnhets(initialEnhets, enhetListVersion);
  }, [initialEnhets, enhetListVersion]);

  return (
    <EnhetContext.Provider value={value}>{children}</EnhetContext.Provider>
  );
}

export function useEnhets() {
  const { initialEnhets } = useContext(EnhetContext);
  const snapshot = useEnhetStoreSnapshot();

  // SSR and first client render need the server-provided initial enhets visible
  // to consumers — the module store is empty at that point.
  const enhetMap = useMemo(() => {
    if (initialEnhets.length === 0) {
      return snapshot.enhetMap;
    }
    let merged: Map<string, TrimmedEnhet> | null = null;
    for (const enhet of initialEnhets) {
      if (snapshot.enhetMap.has(enhet.id)) {
        continue;
      }
      if (!merged) {
        merged = new Map(snapshot.enhetMap);
      }
      merged.set(enhet.id, enhet);
      const identifier = getEnhetIdentifier(enhet);
      if (identifier !== enhet.id) {
        merged.set(identifier, enhet);
      }
    }
    return merged ?? snapshot.enhetMap;
  }, [snapshot.enhetMap, initialEnhets]);

  return {
    enhetMap,
    fullListLoaded: snapshot.loadedVersion !== null,
    ensureFullList,
  };
}
