import type { Base, PaginatedList } from '@digdir/einnsyn-sdk';
import { fetchNextPageAction } from '~/actions/api/pagination';

// Client-side helper function for fetching next page with optional merging
export async function fetchNextPage<T extends Base>(
  currentPage: PaginatedList<T>,
  keepCurrentItems = true,
): Promise<PaginatedList<T>> {
  if (!currentPage.next) {
    return currentPage;
  }

  const nextPage = await fetchNextPageAction<T>(currentPage.next);
  
  if (!nextPage) {
    return currentPage;
  }

  if (!keepCurrentItems) {
    return nextPage;
  }

  const mergedPage = {
    ...nextPage,
    items: [...currentPage.items, ...nextPage.items],
  };

  // Filter duplicates based on item IDs
  const uniqueItems = new Map<string, T>();
  mergedPage.items.forEach((item) => {
    uniqueItems.set(item.id, item);
  });
  mergedPage.items = Array.from(uniqueItems.values());

  return mergedPage;
}