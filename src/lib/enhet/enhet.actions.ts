'use server';

import type { TrimmedEnhet } from './enhet';
import { getEnhetList } from './enhet.server';

// Every export here is a publicly callable endpoint, so this file holds only
// what a client component actually calls. Server-side callers use
// `./enhet.server` directly.

/**
 * Called by the client-side enhet store when the selector opens. The list is
 * left out when the caller already holds the current version.
 */
export async function getTrimmedEnhetList(
  knownVersion?: string,
): Promise<{ enhets?: TrimmedEnhet[]; version: string }> {
  const { trimmed, version } = await getEnhetList();
  return version === knownVersion ? { version } : { enhets: trimmed, version };
}
