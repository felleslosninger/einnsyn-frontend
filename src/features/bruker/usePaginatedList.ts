import type { Base, PaginatedList } from '@digdir/einnsyn-sdk';
import { useCallback, useRef, useState } from 'react';
import { fetchNextPage } from '~/lib/utils/pagination';

export function usePaginatedList<T extends Base>(
  initialPage: PaginatedList<T>,
) {
  const [page, setPage] = useState(initialPage);
  // A page request started before a delete finished still contains the
  // deleted item, so it is filtered out again when the page arrives.
  const deletedIds = useRef(new Set<string>());

  const loadNextPage = useCallback(async () => {
    const next = await fetchNextPage(page);
    setPage({
      ...next,
      items: next.items.filter((item) => !deletedIds.current.has(item.id)),
    });
  }, [page]);

  const removeItem = useCallback((id: string) => {
    deletedIds.current.add(id);
    setPage((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  }, []);

  return { page, loadNextPage, removeItem };
}
