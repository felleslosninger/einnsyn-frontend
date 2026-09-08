import type { Base, PaginatedList } from '@digdir/einnsyn-sdk';
import {
  fetchNextPageAction,
  fetchPreviousPageAction,
} from '~/actions/api/pagination.actions';

// Remove duplicates from a list of items based on their `id` property.
function dedupeById<T extends Base>(items: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of items) {
    map.set(item.id, item);
  }
  return Array.from(map.values());
}

// Reconcile a freshly fetched server window with the list the client has
// already accumulated (via pagination or preload).
export function mergeWindow<T extends Base>(
  current: PaginatedList<T>,
  incoming: PaginatedList<T>,
): PaginatedList<T> {
  const currentIds = new Set(current.items.map((item) => item.id));
  const firstOverlap = incoming.items.findIndex((item) =>
    currentIds.has(item.id),
  );
  if (firstOverlap === -1) {
    return incoming;
  }
  const lastOverlap = incoming.items.findLastIndex((item) =>
    currentIds.has(item.id),
  );
  const above = incoming.items.slice(0, firstOverlap);
  const below = incoming.items.slice(lastOverlap + 1);
  return {
    items: dedupeById([...above, ...current.items, ...below]),
    previous: above.length > 0 ? incoming.previous : current.previous,
    next: below.length > 0 ? incoming.next : current.next,
  };
}

// Client-side helper for fetching next page, merging it with the current
// page, and returning the result.
export async function fetchNextPage<T extends Base>(
  currentPage: PaginatedList<T>,
): Promise<PaginatedList<T>> {
  if (!currentPage.next) {
    return currentPage;
  }

  const nextPage = await fetchNextPageAction<T>(currentPage.next);
  if (!nextPage) {
    return currentPage;
  }

  return {
    items: dedupeById([...currentPage.items, ...nextPage.items]),
    previous: currentPage.previous,
    next: nextPage.next,
  };
}

// Client-side helper for fetching previous page, merging it with the current
// page, and returning the result.
export async function fetchPreviousPage<T extends Base>(
  currentPage: PaginatedList<T>,
): Promise<PaginatedList<T>> {
  if (!currentPage.previous) {
    return currentPage;
  }

  const previousPage = await fetchPreviousPageAction<T>(currentPage.previous);
  if (!previousPage) {
    return currentPage;
  }

  return {
    items: dedupeById([...previousPage.items, ...currentPage.items]),
    previous: previousPage.previous,
    next: currentPage.next,
  };
}
