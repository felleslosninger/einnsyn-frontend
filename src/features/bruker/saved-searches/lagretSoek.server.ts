import 'server-only';

import type { LagretSoek, PaginatedList } from '@digdir/einnsyn-sdk';
import { cachedApiClient } from '~/lib/api/api.server';
import { cachedAuthInfo } from '~/lib/auth/auth.server';
import { logger } from '~/lib/utils/logger';

export async function listLagretSoek(): Promise<PaginatedList<LagretSoek> | null> {
  const authInfo = await cachedAuthInfo();
  if (!authInfo?.id) {
    return { items: [] };
  }

  try {
    const api = await cachedApiClient();
    return await api.bruker.listLagretSoek(authInfo.id);
  } catch (error) {
    logger.error('Failed to list saved searches', error);
    return null;
  }
}
