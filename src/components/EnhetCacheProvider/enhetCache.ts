'use client';

import { useSyncExternalStore } from 'react';
import { getTrimmedEnhetList } from '~/actions/api/enhetActions';
import { getEnhetHref } from '~/lib/utils/enhetUtils';
import type { TrimmedEnhet } from '~/lib/utils/trimmedEnhetUtils';

export type EnhetCacheSnapshot = {
  enhetMap: ReadonlyMap<string, TrimmedEnhet>;
  fullListLoaded: boolean;
};

let snapshot: EnhetCacheSnapshot = {
  enhetMap: new Map<string, TrimmedEnhet>(),
  fullListLoaded: false,
};

const serverSnapshot: EnhetCacheSnapshot = {
  enhetMap: new Map<string, TrimmedEnhet>(),
  fullListLoaded: false,
};

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

function getSnapshot(): EnhetCacheSnapshot {
  return snapshot;
}

function getServerSnapshot(): EnhetCacheSnapshot {
  return serverSnapshot;
}

function addToMap(map: Map<string, TrimmedEnhet>, enhet: TrimmedEnhet) {
  map.set(enhet.id, enhet);
  const href = getEnhetHref(enhet);
  if (href !== enhet.id) {
    map.set(href, enhet);
  }
}

export function seedEnhets(enhets: readonly TrimmedEnhet[]) {
  if (enhets.length === 0) {
    return;
  }

  let changed = false;
  let nextMap: Map<string, TrimmedEnhet> | null = null;
  for (const enhet of enhets) {
    if (snapshot.enhetMap.has(enhet.id)) {
      continue;
    }
    if (!nextMap) {
      nextMap = new Map(snapshot.enhetMap);
    }
    addToMap(nextMap, enhet);
    changed = true;
  }
  if (!changed || !nextMap) {
    return;
  }

  snapshot = { ...snapshot, enhetMap: nextMap };
  notify();
}

let fullListPromise: Promise<void> | null = null;

export function ensureFullList(): Promise<void> {
  if (snapshot.fullListLoaded) {
    return Promise.resolve();
  }
  if (fullListPromise) {
    return fullListPromise;
  }
  fullListPromise = (async () => {
    try {
      const list = await getTrimmedEnhetList();
      const nextMap = new Map(snapshot.enhetMap);
      for (const enhet of list) {
        addToMap(nextMap, enhet);
      }
      snapshot = { enhetMap: nextMap, fullListLoaded: true };
      notify();
    } catch {
      fullListPromise = null;
    }
  })();
  return fullListPromise;
}

export function useEnhetCacheSnapshot(): EnhetCacheSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
