import 'server-only';

import type {
  Innsynskrav,
  ListByBrukerParameters,
  PaginatedList,
} from '@digdir/einnsyn-sdk';
import { cachedApiClient } from '~/lib/api/api.server';
import { cachedAuthInfo } from '~/lib/auth/auth.server';
import { logger } from '~/lib/utils/logger';

export async function listInnsynskrav(): Promise<PaginatedList<Innsynskrav> | null> {
  const authInfo = await cachedAuthInfo();
  if (!authInfo?.id) {
    return { items: [] };
  }

  try {
    const api = await cachedApiClient();
    // The SDK types `id` and `brukerId` as required query parameters, but the
    // bruker id is already part of the path.
    return await api.bruker.listInnsynskrav(authInfo.id, {
      expand: [
        'enhet',
        'journalpost.saksmappe',
        'journalpost.administrativEnhetObjekt',
      ],
      sortOrder: 'desc',
    } as ListByBrukerParameters);
  } catch (error) {
    logger.error('Failed to list access requests', error);
    return null;
  }
}
