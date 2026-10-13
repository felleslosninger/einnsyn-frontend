'use server';

import type { LagretSoek, PaginatedList } from '@digdir/einnsyn-sdk';
import { revalidatePath } from 'next/cache';
import { cachedApiClient } from '~/lib/api/api.server';
import { cachedAuthInfo } from '~/lib/auth/auth.server';

const savedSearchesPath = '/bruker/saved-searches';

export async function listLagretSoek(): Promise<PaginatedList<LagretSoek>> {
  const authInfo = await cachedAuthInfo();
  if (!authInfo?.id) {
    return { items: [] };
  }

  const api = await cachedApiClient();
  return api.bruker.listLagretSoek(authInfo.id);
}

export async function setLagretSoekSubscription(
  id: string,
  subscribe: boolean,
) {
  const api = await cachedApiClient();
  await api.lagretsoek.update(id, { subscribe });
  revalidatePath(savedSearchesPath);
}

export async function deleteLagretSoek(id: string) {
  const api = await cachedApiClient();
  await api.lagretsoek.delete(id);
  revalidatePath(savedSearchesPath);
}
