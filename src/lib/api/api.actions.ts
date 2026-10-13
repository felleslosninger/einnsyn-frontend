'use server';

import type { Base, PaginatedList } from '@digdir/einnsyn-sdk';
import { cachedApiClient } from './api.server';

// Every export here is a publicly callable endpoint, so this file holds only
// what a client component actually calls. Server-side callers use
// `./api.server` directly.

export async function fetchNextPageAction<T extends Base>(
  nextUrl: string,
): Promise<PaginatedList<T> | undefined> {
  const apiClient = await cachedApiClient();
  return await apiClient.fetchNextPage(nextUrl);
}

export async function fetchPreviousPageAction<T extends Base>(
  previousUrl: string,
): Promise<PaginatedList<T> | undefined> {
  const apiClient = await cachedApiClient();
  return await apiClient.fetchPreviousPage(previousUrl);
}
