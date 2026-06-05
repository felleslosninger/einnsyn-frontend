import type { Base, PaginatedList } from '@digdir/einnsyn-sdk';
import {
  fetchNextPageAction,
  fetchPreviousPageAction,
} from '~/actions/api/pagination.actions';

function dedupeById<T extends Base>(items: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of items) {
    map.set(item.id, item);
  }
  return Array.from(map.values());
}

// Find the last index matching a predicate (Array.prototype.findLastIndex is
// not guaranteed by the TS lib target).
function findLastIndex<T>(items: T[], pred: (item: T) => boolean): number {
  for (let i = items.length - 1; i >= 0; i--) {
    if (pred(items[i])) return i;
  }
  return -1;
}

// Reconcile a freshly fetched server window with the list the client has
// already accumulated (via pagination or preload). The server re-hands a window
// on navigation / revalidation; replacing the state outright would discard
// everything the client loaded. Both lists are contiguous slices of the same
// sorted result set, so when they overlap we keep all loaded items and only
// graft on what the new window adds above or below (carrying the cursor from
// whichever side was extended). When they're disjoint — the active item is
// outside the loaded range — we adopt the fresh window.
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
  const lastOverlap = findLastIndex(incoming.items, (item) =>
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

  return {
    ...nextPage,
    previous: currentPage.previous,
    items: dedupeById([...currentPage.items, ...nextPage.items]),
  };
}

// Client-side helper for extending a windowed list backwards by prepending the
// previous page's items.
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
    ...previousPage,
    next: currentPage.next,
    items: dedupeById([...previousPage.items, ...currentPage.items]),
  };
}
