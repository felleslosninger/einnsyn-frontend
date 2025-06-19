'use server';

import type { Base, PaginatedList } from '@digdir/einnsyn-sdk';
import { cachedApiClient } from './getApiClient';

export async function fetchNextPage<T extends Base>(
  currentPage: PaginatedList<T>,
  keepCurrentItems = true,
) {
  const apiClient = await cachedApiClient();
  const nextPage = await apiClient.fetchNextPage(currentPage);
  if (nextPage) {
    if (keepCurrentItems) {
      nextPage.items = [...currentPage.items, ...nextPage.items];
    }
    return nextPage;
  }

  return currentPage;
}
