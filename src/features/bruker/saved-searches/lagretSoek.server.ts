import 'server-only';

import type { LagretSoek, PaginatedList } from '@digdir/einnsyn-sdk';
import { cachedApiClient } from '~/lib/api/api.server';
import { cachedAuthInfo } from '~/lib/auth/auth.server';

export async function listLagretSoek(): Promise<PaginatedList<LagretSoek>> {
  const authInfo = await cachedAuthInfo();
  if (!authInfo?.id) {
    return { items: [] };
  }

  const api = await cachedApiClient();
  return api.bruker.listLagretSoek(authInfo.id);
}
