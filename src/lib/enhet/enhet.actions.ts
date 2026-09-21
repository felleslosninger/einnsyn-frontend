'use server';

import { logger } from '~/lib/utils/logger';
import {
  type FlattenedEnhet,
  getEnhetList,
  getEnhets,
  type VersionedEnhetList,
} from './enhet.server';

// Every export here is a publicly callable endpoint, so this file holds only
// what a client component actually calls. Server-side callers use
// `./enhet.server` directly.

/** Called by the client-side enhet store on first expand of the selector. */
export async function getTrimmedEnhetList(): Promise<VersionedEnhetList> {
  const { trimmed, version } = await getEnhetList();
  return { enhets: trimmed, version };
}

/** Accepts ids or slugs. */
export async function getEnhet(
  idsOrSlugs: string[],
): Promise<FlattenedEnhet[]> {
  try {
    return await getEnhets(idsOrSlugs);
  } catch (error) {
    logger.error('Failed to look up enhets', error);
    return [];
  }
}
