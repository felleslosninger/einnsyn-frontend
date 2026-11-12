import type { Base, PaginatedList } from '@digdir/einnsyn-sdk';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchNextPage,
  fetchPreviousPage,
  mergeWindow,
} from '~/lib/utils/pagination';

/**
 * A bidirectional infinite-scroll window over a `PaginatedList`.
 *
 * The hook owns the window and the fetching; the consumer decides when an
 * edge is near — typically an `EinScrollTrigger` on each side of the list.
 * `extendBackward`/`extendForward` are referentially stable, so an observer
 * bound to them isn't torn down and re-fired on every page change.
 *
 * `shift` is for a virtua list: pass it through so a prepend keeps the
 * visible content still. Consumers without a virtualizer can ignore it.
 */
export function useInfiniteScroll<T extends Base>(
  serverPage: PaginatedList<T>,
): {
  page: PaginatedList<T>;
  extendBackward: () => void;
  extendForward: () => void;
  shift: boolean;
  /** The last extend failed. Cleared by the next one that succeeds. */
  loadFailed: boolean;
} {
  const [page, setPage] = useState(serverPage);

  // Merge, not replace: the client window may extend past the server's.
  useEffect(() => {
    setPage((current) => mergeWindow(current, serverPage));
  }, [serverPage]);

  // Read by the extend callbacks, which must stay stable across pages.
  const pageRef = useRef(page);
  pageRef.current = page;

  const loadingPrevRef = useRef(false);
  const loadingNextRef = useRef(false);
  // Virtua direction flag, not a one-shot: true anchors scroll to the end so
  // prepends don't shift visible content, and stays true so the anchor
  // survives the async ResizeObserver measurement of the prepended rows.
  const [shift, setShift] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const extendBackward = useCallback(async () => {
    const current = pageRef.current;
    if (loadingPrevRef.current || !current.previous) return;
    loadingPrevRef.current = true;
    setShift(true);
    try {
      const extended = await fetchPreviousPage(current);
      setPage((latest) => mergeWindow(latest, extended));
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
    } finally {
      loadingPrevRef.current = false;
    }
  }, []);

  const extendForward = useCallback(async () => {
    const current = pageRef.current;
    if (loadingNextRef.current || !current.next) return;
    loadingNextRef.current = true;
    setShift(false);
    try {
      const extended = await fetchNextPage(current);
      setPage((latest) => mergeWindow(latest, extended));
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
    } finally {
      loadingNextRef.current = false;
    }
  }, []);

  return {
    page,
    extendBackward,
    extendForward,
    shift,
    loadFailed,
  };
}
