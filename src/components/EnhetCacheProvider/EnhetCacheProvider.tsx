'use client';

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { getEnhetHref } from '~/lib/utils/enhetUtils';
import type { TrimmedEnhet } from '~/lib/utils/trimmedEnhetUtils';
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
  children: ReactNode;
};

export function EnhetCacheProvider({ initialEnhets = [], children }: Props) {
  const value = useMemo(() => ({ initialEnhets }), [initialEnhets]);

  // Sync initialEnhets into the module store on the client so the cache persists
  // across provider remounts (e.g. navigation between @header pages).
  useEffect(() => {
    if (initialEnhets.length > 0) {
      seedEnhets(initialEnhets);
    }
  }, [initialEnhets]);

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
      const href = getEnhetHref(enhet);
      if (href !== enhet.id) {
        merged.set(href, enhet);
      }
    }
    return merged ?? snapshot.enhetMap;
  }, [snapshot.enhetMap, initialEnhets]);

  return {
    enhetMap,
    fullListLoaded: snapshot.fullListLoaded,
    ensureFullList,
  };
}
