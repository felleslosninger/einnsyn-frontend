import 'server-only';

import { createHash } from 'node:crypto';
import { EInnsynError, type Enhet } from '@digdir/einnsyn-sdk';
import { getPublicApiClient } from '~/actions/api/getApiClient';
import type { LanguageCode } from '~/lib/translation/translation';
import { logger } from '~/lib/utils/logger';
import { normalizeParamList } from '~/lib/utils/paramList';
import {
  matchesEnhetIdentifier,
  selectInitialEnhets,
  type TrimmedEnhet,
  toTrimmedEnhet,
} from './enhet';

// The API caps `limit` at 100 and the list is ~2000 enhets, so a walk is ~20
// sequential requests.
const ENHET_PAGE_LIMIT = 100;

// The held list and this interval are scaffolding until the SDK revalidates
// responses with ETags; the in-flight dedupe below is not.
export const REVALIDATE_MS = 30 * 60 * 1000;
export const RETRY_AFTER_FAILURE_MS = 60 * 1000;

/**
 * An enhet as held in memory: every field the API returns, with relations
 * flattened to ids so one copy can never retain an expanded subtree.
 *
 * Assignable to {@link Enhet}, so consumers that type against the SDK are
 * unaffected.
 */
export type CachedEnhet = Omit<
  Enhet,
  'parent' | 'underenhet' | 'handteresAv'
> & {
  readonly parent?: string;
  readonly underenhet?: string[];
  readonly handteresAv?: string;
};

export type FetchEnhets = () => Promise<CachedEnhet[]>;

/**
 * The list plus a version the browser can compare against.
 *
 * `trimmed` is memoized here because every reader needs it and mapping ~2000
 * enhets per request is not free.
 */
export type EnhetListSnapshot = {
  enhets: CachedEnhet[];
  trimmed: TrimmedEnhet[];
  version: string;
};

/**
 * Derived from the trimmed content, so every pod computes the same version for
 * the same list and a field the browser never receives cannot invalidate its
 * copy. Content-hashing is the durable mechanism: SDK-side ETag caching would
 * make a refresh cheap, but leaves this layer unable to tell whether anything
 * actually changed.
 */
function toSnapshot(enhets: CachedEnhet[]): EnhetListSnapshot {
  const trimmed = enhets.map(toTrimmedEnhet);
  const version = createHash('sha1')
    .update(JSON.stringify(trimmed))
    .digest('base64url')
    .slice(0, 16);
  return { enhets, trimmed, version };
}

const relationId = (relation: Enhet | string | undefined) =>
  typeof relation === 'string' ? relation : relation?.id;

export const toCachedEnhet = (enhet: Enhet): CachedEnhet => ({
  ...enhet,
  parent: relationId(enhet.parent),
  handteresAv: relationId(enhet.handteresAv),
  underenhet: enhet.underenhet
    ?.map(relationId)
    .filter((id): id is string => id !== undefined),
});

/** Full paginated walk of the enhet list. */
export const walkEnhetList: FetchEnhets = async () => {
  // Deliberately not `cachedPublicApiClient`: React `cache()` needs a request
  // context, and refreshes also run at boot and behind stale reads.
  const api = await getPublicApiClient();
  try {
    logger.debug('Fetching enhet list from API');
    const firstPage = await api.enhet.list({ limit: ENHET_PAGE_LIMIT });
    const enhets: CachedEnhet[] = [];
    for await (const enhet of api.iterate(firstPage)) {
      enhets.push(toCachedEnhet(enhet));
    }

    return enhets;
  } catch (error) {
    if (error instanceof EInnsynError) {
      logger.error('Error fetching enhet list', error);
    }
    throw error;
  }
};

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
  fetchEnhets: FetchEnhets = walkEnhetList,
  now: () => number = Date.now,
) {
  let snapshot: EnhetListSnapshot | null = null;
  let nextRefreshAt = 0;
  let inflight: Promise<EnhetListSnapshot> | null = null;

  const refresh = (): Promise<EnhetListSnapshot> => {
    inflight ??= fetchEnhets()
      .then((fetched) => {
        snapshot = toSnapshot(fetched);
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

const DEFAULT_PRELOAD_LIMIT = 10;

// Not `'use server'`: these read the process-local list and must not become
// callable endpoints. `enhet.actions.ts` exposes the two the client needs.

/**
 * Every enhet, narrowed to what the client needs, stamped with the version the
 * browser stores alongside it. Blocks only on a cold list.
 */
export async function listTrimmedEnhets(): Promise<VersionedEnhets> {
  const { trimmed, version } = await getEnhetList();
  return { enhets: trimmed, version };
}

/**
 * Enhets by id *or* slug.
 *
 * Accepting slugs matters: callers hold `getEnhetIdentifier` values (slug when
 * there is one), and the API's `ids` filter does not resolve those. Anything
 * the list has not seen yet falls back to a single lookup.
 */
export async function getEnhets(
  idsOrSlugs: readonly string[],
): Promise<CachedEnhet[]> {
  const wanted = new Set(normalizeParamList(idsOrSlugs));
  if (wanted.size === 0) {
    return [];
  }

  const found = (await getEnhetList()).enhets.filter((enhet) =>
    matchesEnhetIdentifier(enhet, wanted),
  );
  for (const enhet of found) {
    wanted.delete(enhet.id);
    if (enhet.slug) {
      wanted.delete(enhet.slug);
    }
  }
  if (wanted.size === 0) {
    return found;
  }

  // An enhet created since the last refresh is not in the list yet.
  try {
    const api = await getPublicApiClient();
    const result = await api.enhet.list({ ids: [...wanted] });
    return [...found, ...(result.items ?? []).map(toCachedEnhet)];
  } catch (error) {
    logger.error('Failed to look up enhets missing from the list', error);
    return found;
  }
}

/**
 * What the browser stamps its cached copy with; see {@link EnhetListSnapshot}.
 *
 * Only readers that decline to block on a cold list can report a null version.
 */
export type VersionedEnhets<V extends string | null = string> = {
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
  limit = DEFAULT_PRELOAD_LIMIT,
  languageCode = 'nb',
}: {
  enhetIdentifiers: string[];
  limit?: number;
  languageCode?: LanguageCode;
}): Promise<VersionedEnhets<string | null>> {
  // A collapsed selector with nothing selected needs no preload, and peeking
  // keeps it that way: a cold list must not make every route transition wait
  // on a walk just to carry a version.
  const wanted = new Set(normalizeParamList(enhetIdentifiers));
  if (wanted.size === 0) {
    return { enhets: [], version: peekEnhetListVersion() };
  }

  try {
    const { trimmed, version } = await getEnhetList();
    return {
      enhets: selectInitialEnhets(trimmed, wanted, limit, languageCode),
      version,
    };
  } catch (error) {
    logger.error('Failed to build initial enhet list for request', error);
    return { enhets: [], version: null };
  }
}
