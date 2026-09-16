'use server';

import type {
  LagretSoek,
  LagretSoekRequest,
  PaginatedList,
  SearchParameters,
} from '@digdir/einnsyn-sdk';
import { cachedApiClient } from '~/actions/api/getApiClient';
import { cachedAuthInfo } from '~/actions/authentication/auth';

async function getBrukerId() {
  const authInfo = await cachedAuthInfo();
  if (authInfo?.type !== 'Bruker' || !authInfo.id) {
    throw new Error('Not logged in as a bruker');
  }
  return authInfo.id;
}

export async function listSavedSearches(): Promise<PaginatedList<LagretSoek>> {
  const api = await cachedApiClient();
  return await api.bruker.listLagretSoek(await getBrukerId());
}

export async function addSavedSearch(
  label: string,
  searchParameters: SearchParameters,
  subscribe = false,
): Promise<LagretSoek> {
  const api = await cachedApiClient();
  return await api.bruker.addLagretSoek(await getBrukerId(), {
    label,
    searchParameters,
    subscribe,
  });
}

export async function updateSavedSearch(
  id: string,
  body: Partial<LagretSoekRequest>,
): Promise<LagretSoek> {
  const api = await cachedApiClient();
  return await api.lagretsoek.update(id, body);
}

export async function deleteSavedSearch(id: string): Promise<LagretSoek> {
  const api = await cachedApiClient();
  return await api.lagretsoek.delete(id);
}
