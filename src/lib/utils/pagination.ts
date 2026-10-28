import type { Base, PaginatedList } from '@digdir/einnsyn-sdk';
import {
  fetchNextPageAction,
  fetchPreviousPageAction,
} from '~/lib/api/api.actions';

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
  const incomingIds = new Set(incoming.items.map((item) => item.id));
  const firstOverlap = current.items.findIndex((item) =>
    incomingIds.has(item.id),
  );
  if (firstOverlap === -1) {
    return incoming;
  }
  const lastOverlap = current.items.findLastIndex((item) =>
    incomingIds.has(item.id),
  );

  // The window spans its overlap, out to the end on a side without a cursor.
  const start = incoming.previous ? firstOverlap : 0;
  const end = incoming.next ? lastOverlap + 1 : current.items.length;
  // A loaded item missing from the span may have moved past a cursor we keep,
  // where it would never load again, so start over from the window.
  if (
    current.items.slice(start, end).some((item) => !incomingIds.has(item.id))
  ) {
    return incoming;
  }

  const above = current.items.slice(0, start);
  const below = current.items.slice(end);
  return {
    items: [...above, ...incoming.items, ...below],
    previous: above.length > 0 ? current.previous : incoming.previous,
    next: below.length > 0 ? current.next : incoming.next,
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
