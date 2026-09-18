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
  useEnhetCacheSnapshot,
} from './enhetCache';

type ContextValue = {
  initialEnhets: readonly TrimmedEnhet[];
};

const EnhetCacheContext = createContext<ContextValue>({ initialEnhets: [] });

type Props = {
  initialEnhets?: readonly TrimmedEnhet[];
  enhetListVersion?: string | null;
  children: ReactNode;
};

export function EnhetCacheProvider({
  initialEnhets = [],
  enhetListVersion,
  children,
}: Props) {
  const value = useMemo(() => ({ initialEnhets }), [initialEnhets]);

  // Sync into the module store on the client so the cache persists across
  // provider remounts (e.g. navigation between @header pages). Runs even with
  // no enhets: a render that selects none still carries the version that tells
  // the store whether its full list is stale.
  useEffect(() => {
    seedEnhets(initialEnhets, enhetListVersion);
  }, [initialEnhets, enhetListVersion]);

  return (
    <EnhetCacheContext.Provider value={value}>
      {children}
    </EnhetCacheContext.Provider>
  );
}

export function useEnhetCache() {
  const { initialEnhets } = useContext(EnhetCacheContext);
  const snapshot = useEnhetCacheSnapshot();

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
    // Derived, so consumers keep asking the same question: a version change
    // flips this back to false and their lazy-load effect refetches.
    fullListLoaded: snapshot.loadedVersion !== null,
    ensureFullList,
  };
}
