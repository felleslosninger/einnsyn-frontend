import 'server-only';

import type {
  LagretSak,
  ListByBrukerParameters,
  PaginatedList,
} from '@digdir/einnsyn-sdk';
import { cachedApiClient } from '~/lib/api/api.server';
import { cachedAuthInfo } from '~/lib/auth/auth.server';
import { logger } from '~/lib/utils/logger';

/**
 * The user's saved cases and saved meetings. The API lists both together, so
 * each page filters out the kind it does not show.
 */
export async function listLagretSak(
  expand: string[],
): Promise<PaginatedList<LagretSak> | null> {
  const authInfo = await cachedAuthInfo();
  if (!authInfo?.id) {
    return { items: [] };
  }

  try {
    const api = await cachedApiClient();
    // The SDK types `id` and `brukerId` as required query parameters, but the
    // bruker id is already part of the path.
    return await api.bruker.listLagretSak(authInfo.id, {
      expand,
    } as ListByBrukerParameters);
  } catch (error) {
    logger.error('Failed to list saved cases', error);
    return null;
  }
}
