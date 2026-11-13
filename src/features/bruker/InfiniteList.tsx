'use client';

import { Paragraph } from '@digdir/designsystemet-react';
import type { Base, PaginatedList } from '@digdir/einnsyn-sdk';
import { Fragment, type ReactNode, useState } from 'react';
import { EinScrollTrigger } from '~/components/EinScrollTrigger/EinScrollTrigger';
import { useInfiniteScroll } from '~/hooks/useInfiniteScroll';
import { useTranslation } from '~/hooks/useTranslation';
import styles from './List.module.scss';

// Defined once, so React calls it only when the element mounts.
const focusElement = (element: HTMLElement | null) => {
  element?.focus();
};

/**
 * A paginated list that loads the next page on scroll and lets items remove
 * themselves. What an item looks like, and what deleting it means, is up to
 * `renderItem`.
 */
export default function InfiniteList<T extends Base>({
  initialPage,
  renderItem,
  skeleton,
  emptyText,
  filter,
}: {
  initialPage: PaginatedList<T>;
  /** Call `onDelete` once the item is deleted, to remove it from the list. */
  renderItem: (item: T, onDelete: () => void) => ReactNode;
  skeleton: ReactNode;
  emptyText: string;
  filter?: (item: T) => boolean;
}) {
  const t = useTranslation();
  const { page, extendForward } = useInfiniteScroll(initialPage);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  const items = page.items.filter(
    (item) => !deletedIds.includes(item.id) && (!filter || filter(item)),
  );
  const isEmpty = !items.length && !page.next;

  return (
    <>
      {isEmpty ? (
        // Takes focus when the last item is deleted.
        <Paragraph
          tabIndex={-1}
          ref={deletedIds.length ? focusElement : undefined}
        >
          {emptyText}
        </Paragraph>
      ) : (
        <>
          <ul className={styles.list}>
            {items.map((item) => (
              <Fragment key={item.id}>
                {renderItem(item, () =>
                  setDeletedIds((ids) => [...ids, item.id]),
                )}
              </Fragment>
            ))}
          </ul>
          {page.next && (
            // A new trigger per page, so it fires again if it is still in view.
            <EinScrollTrigger key={page.items.length} onEnter={extendForward}>
              {skeleton}
            </EinScrollTrigger>
          )}
        </>
      )}
      <div role="status" className="ds-sr-only">
        {/* A new key per deletion, so each one is announced. */}
        {deletedIds.length > 0 && (
          <span key={deletedIds.length}>{t('common.deleted')}</span>
        )}
      </div>
    </>
  );
}
