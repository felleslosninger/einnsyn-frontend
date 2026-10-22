'use client';

import { useSyncExternalStore } from 'react';
import type { TrimmedEnhet } from '~/lib/enhet/enhet';
import { getTrimmedEnhetList } from '~/lib/enhet/enhet.actions';
import { logger } from '~/lib/utils/logger';

export type EnhetStoreSnapshot = {
  enhetMap: ReadonlyMap<string, TrimmedEnhet>;
  loadedVersion: string | null;
};

// Never mutated: every update assigns a new snapshot.
const emptySnapshot: EnhetStoreSnapshot = {
  enhetMap: new Map<string, TrimmedEnhet>(),
  loadedVersion: null,
};

let snapshot = emptySnapshot;
let fullListPromise: Promise<void> | null = null;

const subscribers = new Set<() => void>();

function notify() {
  for (const cb of subscribers) {
    cb();
  }
}

function subscribe(cb: () => void) {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

export function getEnhetStoreSnapshot(): EnhetStoreSnapshot {
  return snapshot;
}

function getServerSnapshot(): EnhetStoreSnapshot {
  return emptySnapshot;
}

function addToMap(map: Map<string, TrimmedEnhet>, enhet: TrimmedEnhet) {
  map.set(enhet.id, enhet);
  if (enhet.slug) {
    map.set(enhet.slug, enhet);
  }
}

/** Merge server-rendered enhets into the store, keeping the ones it holds. */
export function seedEnhets(enhets: readonly TrimmedEnhet[]) {
  let nextMap: Map<string, TrimmedEnhet> | null = null;
  for (const enhet of enhets) {
    if (snapshot.enhetMap.has(enhet.id)) {
      continue;
    }
    nextMap ??= new Map(snapshot.enhetMap);
    addToMap(nextMap, enhet);
  }
  if (nextMap) {
    snapshot = { ...snapshot, enhetMap: nextMap };
    notify();
  }
}

/**
 * Load the full list, or check that the loaded one is still current: the server
 * leaves the list out when the version sent is its own. Callers share a request.
 */
export function ensureEnhetListLoaded(): Promise<void> {
  fullListPromise ??= (async () => {
    try {
      const { enhets, version } = await getTrimmedEnhetList(
        snapshot.loadedVersion ?? undefined,
      );
      if (!enhets) {
        return;
      }
      // Rebuild, or enhets the API has dropped keep their id and slug keys.
      const nextMap = new Map<string, TrimmedEnhet>();
      for (const enhet of enhets) {
        addToMap(nextMap, enhet);
      }
      snapshot = { enhetMap: nextMap, loadedVersion: version };
      notify();
    } catch (error) {
      // Surfaced as "not loaded": the store carries no error state yet, so
      // consumers keep their loading view until a later call succeeds.
      logger.error('Failed to load enhet list', error);
    } finally {
      fullListPromise = null;
    }
  })();
  return fullListPromise;
}

export function useEnhetStoreSnapshot(): EnhetStoreSnapshot {
  return useSyncExternalStore(
    subscribe,
    getEnhetStoreSnapshot,
    getServerSnapshot,
  );
}
