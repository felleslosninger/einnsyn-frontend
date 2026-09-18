'use server';

import {
  type FlattenedEnhet,
  getEnhetList,
  getEnhets,
  type VersionedEnhetList,
} from './enhet.server';

// Every export here is a publicly callable endpoint, so this file holds only
// what a client component actually calls. Server-side callers use
// `./enhet.server` directly.

/** Called by the client-side enhet cache on first expand of the selector. */
export async function getTrimmedEnhetList(): Promise<VersionedEnhetList> {
  const { trimmed, version } = await getEnhetList();
  return { enhets: trimmed, version };
}

/** Accepts ids or slugs; served from the server-side cache. */
export async function getEnhet(
  idsOrSlugs: string[],
): Promise<FlattenedEnhet[]> {
  return getEnhets(idsOrSlugs);
}
