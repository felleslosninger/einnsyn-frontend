'use client';

import { Breadcrumbs } from '@digdir/designsystemet-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import styles from './Breadcrumbs.module.scss';

export type BreadcrumbItem = {
  label: string;
  href: string;
};

type CrumbSlot = { kind: 'item'; item: BreadcrumbItem } | { kind: 'ellipsis' };

/**
 * Reduce an ancestor list to `chain.length - hide` visible items. Items are
 * dropped symmetrically from the middle (root-side gets the extra when the
 * remaining count is odd). Once only one item remains the ellipsis sits to
 * the left of it.
 */
function buildVisibleItems(
  chain: readonly BreadcrumbItem[],
  hide: number,
): CrumbSlot[] {
  if (chain.length === 0) return [];
  if (hide <= 0) return chain.map((item) => ({ kind: 'item', item }));

  const n = chain.length;
  const totalShow = Math.max(1, n - hide);

  if (totalShow === 1) {
    return [{ kind: 'ellipsis' }, { kind: 'item', item: chain[n - 1] }];
  }

  const leftCount = Math.ceil(totalShow / 2);
  const rightCount = totalShow - leftCount;

  const slots: CrumbSlot[] = [];
  for (let i = 0; i < leftCount; i++) {
    slots.push({ kind: 'item', item: chain[i] });
  }
  slots.push({ kind: 'ellipsis' });
  for (let i = n - rightCount; i < n; i++) {
    slots.push({ kind: 'item', item: chain[i] });
  }
  return slots;
}

/**
 * Renders an ordered breadcrumb trail. `items` are the linkable ancestors;
 * `current` is the trailing aria-current label.
 *
 * On overflow the component first collapses `items` from the middle one by
 * one (a single ellipsis crumb represents the hidden range), and only once a
 * single ancestor remains does it fall back to CSS text-overflow on
 * `current`. The breadcrumb never wraps.
 */
export default function EinBreadcrumb({
  items,
  current,
}: {
  items: readonly BreadcrumbItem[];
  current: string;
}) {
  const t = useTranslation();

  const listRef = useRef<HTMLOListElement>(null);
  const [hide, setHide] = useState(0);
  const [truncateCurrent, setTruncateCurrent] = useState(false);

  const maxHide = Math.max(0, items.length - 1);

  const visibleItems = useMemo(
    () => buildVisibleItems(items, hide),
    [items, hide],
  );

  // Reset when the surrounding container resizes (window resize, header
  // sticky changes, etc.) so we re-measure from a clean slate.
  useEffect(() => {
    const wrapper = listRef.current?.parentElement;
    if (!wrapper || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      setHide(0);
      setTruncateCurrent(false);
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  // Synchronous overflow check + reduction. Re-runs each render before
  // paint, so the user only ever sees the converged state.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (el.scrollWidth <= el.clientWidth + 1) return;

    if (hide < maxHide) {
      setHide((h) => h + 1);
    } else if (!truncateCurrent) {
      setTruncateCurrent(true);
    }
  });

  return (
    <Breadcrumbs
      className={styles.breadcrumbs}
      aria-label={t('breadcrumbs.label')}
    >
      <Breadcrumbs.List ref={listRef} className={styles.breadcrumbsList}>
        {visibleItems.map((slot) =>
          slot.kind === 'ellipsis' ? (
            <Breadcrumbs.Item key="ellipsis">
              <span className={styles.ellipsis} aria-hidden="true">
                …
              </span>
            </Breadcrumbs.Item>
          ) : (
            <Breadcrumbs.Item key={slot.item.href}>
              <Breadcrumbs.Link href={slot.item.href}>
                {slot.item.label}
              </Breadcrumbs.Link>
            </Breadcrumbs.Item>
          ),
        )}
        <Breadcrumbs.Item>
          <span
            className={cn(styles.currentItem, {
              [styles.truncate]: truncateCurrent,
            })}
          >
            {current}
          </span>
        </Breadcrumbs.Item>
      </Breadcrumbs.List>
    </Breadcrumbs>
  );
}
