'use server';

import type { Base, PaginatedList } from '@digdir/einnsyn-sdk';
import { cachedApiClient } from './api.server';

// Every export here is a publicly callable endpoint, so this file holds only
// what a client component actually calls. Server-side callers use
// `./api.server` directly.

function getSafePaginationPath(paginationUrl: string): string {
  const apiUrl = new URL(process.env.API_URL);
  const url = new URL(paginationUrl, apiUrl);

  if (
    url.origin !== apiUrl.origin ||
    url.username ||
    url.password ||
    url.hash
  ) {
    throw new Error('Invalid pagination URL');
  }

  return `${url.pathname}${url.search}`;
}

export async function fetchNextPageAction<T extends Base>(
  nextUrl: string,
): Promise<PaginatedList<T> | undefined> {
  const safePath = getSafePaginationPath(nextUrl);
  const apiClient = await cachedApiClient();
  return await apiClient.fetchNextPage(safePath);
}

export async function fetchPreviousPageAction<T extends Base>(
  previousUrl: string,
): Promise<PaginatedList<T> | undefined> {
  const safePath = getSafePaginationPath(previousUrl);
  const apiClient = await cachedApiClient();
  return await apiClient.fetchPreviousPage(safePath);
}
