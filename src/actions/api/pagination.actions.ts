'use server';

import type { Base, PaginatedList } from '@digdir/einnsyn-sdk';
import { cachedApiClient } from './getApiClient';

export async function fetchNextPageAction<T extends Base>(
  nextUrl: string,
): Promise<PaginatedList<T> | undefined> {
  const apiClient = await cachedApiClient();
  return await apiClient.fetchNextPage(nextUrl);
}
