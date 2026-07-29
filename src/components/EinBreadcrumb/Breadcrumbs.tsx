'use client';

import { Breadcrumbs } from '@digdir/designsystemet-react';
import {
  type MouseEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { EinLink } from '~/components/EinLink/EinLink';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { prefersReducedMotion } from '~/lib/utils/prefersReducedMotion';
import styles from './Breadcrumbs.module.scss';

export type BreadcrumbItem = {
  label: string;
  href?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  // Forwarded to EinLink. Set `false` when `onClick` runs its own (smooth)
  // scroll — Next's scroll-to-top on navigation would otherwise cancel it.
  scroll?: boolean;
  // Forwarded to EinLink. Defaults to off for ancestors: each prefetch pulls a
  // full RSC payload, and the enhet routes these point at render a search page
  // (an upstream API query per ancestor) for links users rarely follow from here.
  prefetch?: boolean;
  // Stable accessible name, defaulting to `label`. Useful when the visible label
  // is animated (see `animate`) so assistive tech announces the final text, not
  // the intermediate typewriter frames.
  ariaLabel?: string;
};

type CrumbSlot = { kind: 'item'; item: BreadcrumbItem } | { kind: 'ellipsis' };

// Typewriter timings for the animated trailing crumb; the per-char rate is
// capped so long labels stay snappy.
const ERASE_MS_PER_CHAR = 5;
const TYPE_MS_PER_CHAR = 5;
const PHASE_CAP_MS = 150;

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
 * Renders an ordered breadcrumb trail from `items`. The trailing item is the
 * "current" crumb; every item before it is a collapsible ancestor. Any item may
 * carry an `href` (a link) or omit it (plain text — typically the current crumb).
 *
 * On overflow the component first collapses the ancestors from the middle one by
 * one (a single ellipsis crumb represents the hidden range), and only once a
 * single ancestor remains does it fall back to CSS text-overflow on the current
 * crumb. The breadcrumb never wraps.
 *
 * With `animate`, the current crumb's label morphs typewriter-style whenever it
 * changes — the old text is erased last-char-first, then the new is typed
 * first-char-first (instant under prefers-reduced-motion).
 */
export default function EinBreadcrumb({
  items,
  animate = false,
}: {
  items: readonly BreadcrumbItem[];
  animate?: boolean;
}) {
  const t = useTranslation();

  // Split the trailing "current" crumb from the collapsible ancestor chain.
  const current = items.length > 0 ? items[items.length - 1] : undefined;
  const currentLabel = current?.label ?? '';

  const listRef = useRef<HTMLOListElement>(null);
  const [hide, setHide] = useState(0);
  const [truncateCurrent, setTruncateCurrent] = useState(false);

  const maxHide = Math.max(0, items.length - 1);

  const visibleItems = useMemo(
    () => buildVisibleItems(items, hide),
    [items, hide],
  );

  // Typewriter state for the current crumb's label. When not animating it just
  // tracks the label. State-driven (not DOM-mutated) so it stays SSR-safe and
  // React keeps owning the text — and each frame re-runs the overflow check
  // below, which naturally re-truncates as the text grows/shrinks.
  const [display, setDisplay] = useState(currentLabel);
  const displayRef = useRef(display);
  displayRef.current = display;

  useEffect(() => {
    if (!animate) {
      if (displayRef.current !== currentLabel) setDisplay(currentLabel);
      return;
    }
    if (displayRef.current === currentLabel) return;
    if (prefersReducedMotion()) {
      setDisplay(currentLabel);
      return;
    }

    // Re-measure overflow from scratch for the new text (covers both grow and
    // shrink — the converge below only ever increases truncation).
    setHide(0);
    setTruncateCurrent(false);

    const from = displayRef.current;
    const to = currentLabel;
    // Time-driven, not character-driven: each frame derives how much text to show
    // from the elapsed time. A per-character setTimeout chain honours neither half
    // of the contract — a 120-char title needs ~1.2ms ticks and browsers clamp
    // nested timeouts to ~4ms, stretching a "150ms" phase past 400ms (outliving
    // the 280ms header collapse it accompanies) — and it costs one render per
    // character, each forcing a synchronous layout in the overflow check below.
    // At ~4ms/tick that was several renders per painted frame, so per-character
    // granularity was never visible anyway. One render per frame instead.
    const eraseMs = Math.min(ERASE_MS_PER_CHAR * from.length, PHASE_CAP_MS);
    const typeMs = Math.min(TYPE_MS_PER_CHAR * to.length, PHASE_CAP_MS);
    const totalMs = eraseMs + typeMs;

    // Track what's been shown locally rather than via displayRef (which only
    // updates on render) so a frame can't queue a redundant state update.
    let shown = from;
    const show = (next: string) => {
      if (next === shown) return;
      shown = next;
      setDisplay(next);
    };

    let raf = 0;
    let start: number | undefined;
    const step = (now: number) => {
      start ??= now;
      const elapsed = now - start;
      if (elapsed < eraseMs) {
        // Erase the old label, last char first (floor → reaches '' by eraseMs).
        show(from.slice(0, Math.floor(from.length * (1 - elapsed / eraseMs))));
      } else if (elapsed < totalMs) {
        // Then type the new one, first char first.
        show(
          to.slice(0, Math.ceil(to.length * ((elapsed - eraseMs) / typeMs))),
        );
      } else {
        show(to);
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    return () => cancelAnimationFrame(raf);
  }, [animate, currentLabel]);

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
    // Already fully collapsed and truncated: nothing left to reduce, so skip the
    // measurement entirely — reading scrollWidth forces a synchronous layout of
    // the whole document, and this effect runs after every commit.
    if (hide >= maxHide && truncateCurrent) return;
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
        {visibleItems.map((slot) => {
          if (slot.kind === 'ellipsis') {
            return (
              <Breadcrumbs.Item key="ellipsis">
                <span className={styles.ellipsis} aria-hidden="true">
                  …
                </span>
              </Breadcrumbs.Item>
            );
          }
          const { item } = slot;
          const isCurrent = item === current;
          const ariaLabel = item.ariaLabel ?? item.label;

          // Only the current crumb morphs typewriter-style: it shows the lagging
          // `display` text (aria-hidden, with a stable accessible name alongside)
          // instead of `item.label`. Every other crumb just shows its label.
          const animating = isCurrent && animate;
          const content = animating ? (
            <>
              <span aria-hidden="true">{display}</span>
              {!item.href && <span className="ds-sr-only">{ariaLabel}</span>}
            </>
          ) : (
            item.label
          );

          // `asChild` keeps the standard breadcrumb-link styling
          // (Breadcrumbs.Link → ds-link) while EinLink supplies the app's
          // client-side navigation + prefetch.
          //
          // `aria-current="page"` on links is owned by <ds-breadcrumbs>, which
          // stamps it on the LAST <a> in the trail and clears it from the rest on
          // every childList mutation (see DSBreadcrumbsElement in
          // @digdir/designsystemet-web). Setting it here would just be clobbered,
          // so don't — but note the flip side: while the current crumb is plain
          // text, the design system marks the last ANCESTOR link instead,
          // duplicating the marker set on the span below.
          const crumb = item.href ? (
            <Breadcrumbs.Link asChild>
              <EinLink
                href={item.href}
                onClick={item.onClick}
                scroll={item.scroll}
                prefetch={item.prefetch ?? isCurrent}
                aria-label={animating ? ariaLabel : undefined}
              >
                {content}
              </EinLink>
            </Breadcrumbs.Link>
          ) : (
            <span aria-current={isCurrent ? 'page' : undefined}>{content}</span>
          );

          return (
            // The current crumb keeps a fixed key so the pose flip (plain text →
            // linked title) doesn't recreate its <li>, which would re-run the
            // design system's mutation observer and EinLink's prefetch effect.
            <Breadcrumbs.Item key={isCurrent ? 'current' : item.href}>
              {isCurrent ? (
                // The current crumb is the truncation target — wrap it so the
                // last-resort ellipsis (.truncate) clips a long label.
                <span
                  className={cn(styles.currentItem, {
                    [styles.truncate]: truncateCurrent,
                  })}
                >
                  {crumb}
                </span>
              ) : (
                crumb
              )}
            </Breadcrumbs.Item>
          );
        })}
      </Breadcrumbs.List>
    </Breadcrumbs>
  );
}
