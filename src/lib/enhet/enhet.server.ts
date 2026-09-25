import 'server-only';

import { createHash } from 'node:crypto';
import type { Enhet } from '@digdir/einnsyn-sdk';
import { getPublicApiClient } from '~/actions/api/getApiClient';
import { logger } from '~/lib/utils/logger';
import { normalizeParamList } from '~/lib/utils/paramList';
import {
  expandAncestorsInEnhetList,
  matchesEnhetIdentifier,
  type TrimmedEnhet,
  toTrimmedEnhet,
} from './enhet';

// The API caps `limit` at 100
const ENHET_PAGE_LIMIT = 100;

// The held list and this interval are scaffolding until the SDK revalidates
// responses with ETags; the in-flight dedupe below is not.
export const REVALIDATE_MS = 30 * 60 * 1000;
export const RETRY_AFTER_FAILURE_MS = 60 * 1000;

/**
 * Every field the API returns, with relations flattened to ids so a copy held
 * in memory can never retain an expanded subtree.
 *
 * Assignable to {@link Enhet}, so consumers that type against the SDK are
 * unaffected.
 */
export type FlattenedEnhet = Omit<
  Enhet,
  'parent' | 'underenhet' | 'handteresAv'
> & {
  readonly parent?: string;
  readonly underenhet?: string[];
  readonly handteresAv?: string;
};

/**
 * The list plus a version the browser can compare against.
 */
export type EnhetListSnapshot = {
  enhets: FlattenedEnhet[];
  trimmed: TrimmedEnhet[];
  version: string;
};

/**
 * Convert a list of Enhets to a snapshot, trimming and sorting them and
 * generating a version hash.
 */
function toSnapshot(enhets: FlattenedEnhet[]): EnhetListSnapshot {
  // Trim
  const trimmed = enhets.map(toTrimmedEnhet);

  // Sort
  const sorted = trimmed.sort((a, b) =>
    a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
  );

  // Generate version hash
  const version = createHash('sha256')
    .update(JSON.stringify(sorted))
    .digest('base64url')
    .slice(0, 16);

  return { enhets, trimmed, version };
}

const relationId = (relation: Enhet | string | undefined) =>
  typeof relation === 'string' ? relation : relation?.id;

/** Turn expanded relations into ids. */
export const toFlattenedEnhet = (enhet: Enhet): FlattenedEnhet => ({
  ...enhet,
  parent: relationId(enhet.parent),
  handteresAv: relationId(enhet.handteresAv),
  underenhet: enhet.underenhet
    ?.map(relationId)
    .filter((id): id is string => id !== undefined),
});

/**
 * Process-local enhet list, served stale while refreshing behind it.
 *
 * The dedupe is the point: `unstable_cache` collapses nothing, and 94
 * concurrent walks OOM-killed a pod on 2026-09-10. SDK-side ETag caching will
 * make each walk cheap, but not concurrent walks fewer.
 *
 * A factory only so tests can drive it with a fake fetch and clock.
 */
export function createEnhetListCache(
  fetchEnhets = getEnhets,
  now: () => number = Date.now,
) {
  let snapshot: EnhetListSnapshot | null = null;
  let nextRefreshAt = 0;
  let inflight: Promise<EnhetListSnapshot> | null = null;

  // What a cold cache replays during its backoff window, since it has no list
  // to serve instead. Null once anything has succeeded.
  let coldFailure: unknown = null;

  const refresh = (): Promise<EnhetListSnapshot> => {
    inflight ??= fetchEnhets()
      .then((fetched) => {
        snapshot = toSnapshot(fetched);
        coldFailure = null;
        nextRefreshAt = now() + REVALIDATE_MS;
        return snapshot;
      })
      .catch((error: unknown) => {
        logger.error('Failed to refresh enhet list', error);
        // Back off, or a stale entry retries the full walk on every read while
        // the API is down.
        nextRefreshAt = now() + RETRY_AFTER_FAILURE_MS;
        // Keep serving the last good list; a cold cache has none, so the caller
        // has to see the failure.
        if (snapshot) {
          return snapshot;
        }
        coldFailure = error;
        throw error;
      })
      .finally(() => {
        inflight = null;
      });
    return inflight;
  };

  // Rejections are swallowed because there is no caller to surface them to —
  // `refresh` has already logged them.
  const refreshInBackground = () => void refresh().catch(() => {});

  return {
    /** Blocks only on a cold cache. */
    get: async (): Promise<EnhetListSnapshot> => {
      if (!snapshot) {
        // The backoff has to cover the cold case too: with no list to fall
        // back on, every read would otherwise start its own walk for as long
        // as the API stays down.
        if (coldFailure !== null && now() < nextRefreshAt) {
          throw coldFailure;
        }
        return refresh();
      }
      if (now() >= nextRefreshAt) {
        refreshInBackground();
      }
      return snapshot;
    },
    /** The current version, or null on a cold cache. Never blocks. */
    peekVersion: () => snapshot?.version ?? null,
    warm: refreshInBackground,
  };
}

// Next evaluates this module twice in one process — once for `instrumentation`,
// once for the render path — so the cache has to hang off `globalThis` or the
// boot warm populates a list no request ever reads.
const CACHE_KEY = Symbol.for('einnsyn.enhetListCache');
type GlobalWithCache = typeof globalThis & {
  [CACHE_KEY]?: ReturnType<typeof createEnhetListCache>;
};
const globalWithCache = globalThis as GlobalWithCache;
const cache = globalWithCache[CACHE_KEY] ?? createEnhetListCache();
globalWithCache[CACHE_KEY] = cache;

export const getEnhetList = cache.get;

/** The current list version without blocking on a cold cache. */
export const peekEnhetListVersion = cache.peekVersion;

/**
 * Called from `instrumentation.ts`, the only hook that runs before the first
 * request. Warming at module scope instead would make merely importing this
 * file reach the API.
 */
export const warmEnhetList = cache.warm;

/**
 * Enhets by id or slug, straight from the API; every enhet when given none,
 * which is the walk the cache refreshes with.
 *
 * Rejects rather than returning `[]`, or a failed refresh would be
 * indistinguishable from an empty list and get held as one.
 */
export async function getEnhets(
  identifiers?: readonly string[],
): Promise<FlattenedEnhet[]> {
  // Don't look up an empty list, this will return all Enhets paginated.
  if (identifiers !== undefined && identifiers.length === 0) {
    return [];
  }

  const api = await getPublicApiClient();
  const page = await api.enhet.list({
    ids: identifiers ? [...identifiers] : undefined,
    limit: ENHET_PAGE_LIMIT,
  });

  const enhets: FlattenedEnhet[] = [];
  for await (const enhet of api.iterate(page)) {
    enhets.push(toFlattenedEnhet(enhet));
  }

  return enhets;
}

/**
 * What the browser stamps its cached copy with; see {@link EnhetListSnapshot}.
 *
 * Only readers that decline to block on a cold list can report a null version.
 */
export type VersionedEnhetList<V extends string | null = string> = {
  enhets: TrimmedEnhet[];
  version: V;
};

/**
 * The enhets the selector has to render on first paint, plus the current
 * version — sent on every render so a browser holding a stale full list finds
 * out without spending a request on it.
 */
export async function getInitialEnhets({
  enhetIdentifiers,
}: {
  enhetIdentifiers: string[];
}): Promise<VersionedEnhetList<string | null>> {
  // A collapsed selector with nothing selected needs no preload, and peeking
  // keeps it that way: a cold list must not make every route transition wait
  // on a walk just to carry a version.
  const selectedEnhetSet = new Set(normalizeParamList(enhetIdentifiers));
  if (selectedEnhetSet.size === 0) {
    return { enhets: [], version: peekEnhetListVersion() };
  }

  try {
    const { trimmed, version } = await getEnhetList();
    const selected = trimmed.filter((enhet) =>
      matchesEnhetIdentifier(enhet, selectedEnhetSet),
    );
    const selectedWithAncestors = expandAncestorsInEnhetList(selected, trimmed);

    return {
      enhets: selectedWithAncestors,
      version,
    };
  } catch (error) {
    logger.error('Failed to build initial enhet list for request', error);
    return { enhets: [], version: null };
  }
}
