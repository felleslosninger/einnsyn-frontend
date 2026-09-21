'use client';

import { useSyncExternalStore } from 'react';
import type { TrimmedEnhet } from '~/lib/enhet/enhet';
import { getTrimmedEnhetList } from '~/lib/enhet/enhet.actions';
import { logger } from '~/lib/utils/logger';

export type EnhetCacheSnapshot = {
  enhetMap: ReadonlyMap<string, TrimmedEnhet>;
  loadedVersion: string | null;
};

let snapshot: EnhetCacheSnapshot = {
  enhetMap: new Map<string, TrimmedEnhet>(),
  loadedVersion: null,
};

const serverSnapshot: EnhetCacheSnapshot = {
  enhetMap: new Map<string, TrimmedEnhet>(),
  loadedVersion: null,
};

// The newest version any server response has carried, and a counter bumped
// whenever it moves. The counter is what an in-flight full-list fetch compares
// against — versions are opaque hashes, so they cannot be ordered.
let latestVersion: string | null = null;
let versionEpoch = 0;
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

export function getEnhetCacheSnapshot(): EnhetCacheSnapshot {
  return snapshot;
}

function getServerSnapshot(): EnhetCacheSnapshot {
  return serverSnapshot;
}

function addToMap(map: Map<string, TrimmedEnhet>, enhet: TrimmedEnhet) {
  // A re-slugged enhet would otherwise keep its old alias pointing at the stale
  // copy. The identity check leaves the alias alone when another enhet has
  // taken it over in the meantime.
  const previous = map.get(enhet.id);
  if (
    previous?.slug &&
    previous.slug !== enhet.slug &&
    map.get(previous.slug) === previous
  ) {
    map.delete(previous.slug);
  }

  map.set(enhet.id, enhet);
  if (enhet.slug) {
    map.set(enhet.slug, enhet);
  }
}

/**
 * Merge server-rendered enhets into the store, and drop the full list when the
 * server reports a version we did not load under.
 *
 * The cached entries are kept across that invalidation: stale names render
 * better than blank ones while the refetch runs.
 */
export function seedEnhets(
  enhets: readonly TrimmedEnhet[],
  version?: string | null,
) {
  let changed = false;

  const versionMoved = !!version && version !== latestVersion;
  if (versionMoved) {
    latestVersion = version;
    versionEpoch += 1;
    if (snapshot.loadedVersion !== null) {
      snapshot = { ...snapshot, loadedVersion: null };
      changed = true;
    }
  }

  let nextMap: Map<string, TrimmedEnhet> | null = null;
  for (const enhet of enhets) {
    // A moved version means our copy of this enhet may be the stale one, so
    // seeded entries overwrite rather than skip.
    if (!versionMoved && snapshot.enhetMap.has(enhet.id)) {
      continue;
    }
    nextMap ??= new Map(snapshot.enhetMap);
    addToMap(nextMap, enhet);
    changed = true;
  }
  if (nextMap) {
    snapshot = { ...snapshot, enhetMap: nextMap };
  }

  if (changed) {
    notify();
  }
}

export function ensureFullList(): Promise<void> {
  if (snapshot.loadedVersion !== null) {
    return Promise.resolve();
  }
  if (fullListPromise) {
    return fullListPromise;
  }

  const epochAtStart = versionEpoch;
  let invalidatedMidFetch = false;
  fullListPromise = (async () => {
    try {
      const { enhets, version } = await getTrimmedEnhetList();
      const nextMap = new Map(snapshot.enhetMap);
      for (const enhet of enhets) {
        addToMap(nextMap, enhet);
      }

      // A seed may have advanced the version while this was in flight. Marking
      // the list loaded would then strand the store on data the server has
      // already moved past, so keep the entries but stay invalid and refetch.
      if (versionEpoch !== epochAtStart) {
        invalidatedMidFetch = true;
        snapshot = { ...snapshot, enhetMap: nextMap };
      } else {
        latestVersion = version;
        snapshot = { enhetMap: nextMap, loadedVersion: version };
      }
      notify();
    } catch (error) {
      // Surfaced as "not loaded": the store carries no error state yet, so
      // consumers keep their loading view until a later call succeeds.
      logger.error('Failed to load enhet list', error);
    } finally {
      // The only release point, so the slot is non-null exactly while a fetch
      // is in flight and a seed cannot null it out from under one.
      fullListPromise = null;
      // Nothing else would retry: the sole caller re-runs its effect on
      // `fullListLoaded`, which an invalidated fetch never flips.
      if (invalidatedMidFetch) {
        void ensureFullList();
      }
    }
  })();
  return fullListPromise;
}

export function useEnhetCacheSnapshot(): EnhetCacheSnapshot {
  return useSyncExternalStore(
    subscribe,
    getEnhetCacheSnapshot,
    getServerSnapshot,
  );
}
