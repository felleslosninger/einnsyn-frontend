import { type RefObject, useCallback, useLayoutEffect, useRef } from 'react';
import { EXPAND_DURATION_MS } from '~/components/EinExpandable/EinExpandable';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import { suspendScrollDirection } from '~/hooks/useScrollState';
import { animationFrame } from '~/lib/utils/animationFrame';

// User input cancels the scroll glide. The click that started the expansion
// fired its pointerdown before the listener goes on.
const SCROLL_ABORT_EVENTS = ['wheel', 'pointerdown', 'keydown'] as const;

// Height of the site header (the first out-of-flow <header>). Measured live
// rather than read from `--ein-header-height`, which trails the header's
// resize by a render.
function stickyHeaderHeight(): number {
  for (const el of document.querySelectorAll('header')) {
    const { position } = getComputedStyle(el);
    if (position === 'fixed' || position === 'sticky') {
      return el.getBoundingClientRect().height;
    }
  }
  return 0;
}

// Viewport-relative. An item between `visibleTop` and `visibleBottom` (the
// header and the bottom edge) is in view; one that has to move comes to rest
// between `top` and `bottom`, the same inset by its `scroll-margin`.
type Bounds = {
  visibleTop: number;
  visibleBottom: number;
  top: number;
  bottom: number;
};

function restingBounds(item: Element | null | undefined): Bounds {
  const style = item ? getComputedStyle(item) : undefined;
  const margin = (value = '') => Number.parseFloat(value) || 0;
  const visibleTop = stickyHeaderHeight();
  const visibleBottom = window.innerHeight;
  return {
    visibleTop,
    visibleBottom,
    top: visibleTop + margin(style?.scrollMarginTop),
    bottom: visibleBottom - margin(style?.scrollMarginBottom),
  };
}

// How an expanded item should come to rest. Intent rather than a coordinate:
// the header it must clear changes height as the page scrolls.
type Placement =
  | { mode: 'top' } // taller than the viewport, or hidden behind the header
  | { mode: 'bottom'; itemHeight: number } // fits, but hangs below the fold
  | { mode: 'keep'; top: number }; // already fully in view

function placeExpanded(
  currentTop: number,
  itemHeight: number,
  bounds: Bounds,
): Placement {
  // In view is enough: the margin is only for where a moved item stops.
  if (
    currentTop >= bounds.visibleTop &&
    currentTop + itemHeight <= bounds.visibleBottom
  ) {
    return { mode: 'keep', top: currentTop };
  }
  if (bounds.top + itemHeight > bounds.bottom) return { mode: 'top' };
  if (currentTop < bounds.visibleTop) return { mode: 'top' };
  return { mode: 'bottom', itemHeight };
}

function placementTop(placement: Placement, bounds: Bounds): number {
  if (placement.mode === 'top') return bounds.top;
  if (placement.mode === 'bottom') {
    return Math.max(bounds.top, bounds.bottom - placement.itemHeight);
  }
  return Math.max(bounds.visibleTop, placement.top);
}

// Matches `fx.$easeOut` ($easeOutQuint) so the scroll glide follows the CSS
// height transition.
function easeOutQuint(t: number): number {
  return 1 - (1 - t) ** 5;
}

let stopActiveGlide: (() => void) | null = null;

// Glide the window by `delta` over the expand duration. A new glide replaces
// a running one, and user input cancels it.
function smoothScrollBy(delta: number) {
  stopActiveGlide?.();
  if (Math.abs(delta) < 1) return;

  const start = performance.now();
  let applied = 0;
  let frame = 0;
  const releaseScrollDirection = suspendScrollDirection();
  const stop = () => {
    cancelAnimationFrame(frame);
    for (const type of SCROLL_ABORT_EVENTS) {
      window.removeEventListener(type, stop);
    }
    releaseScrollDirection();
    if (stopActiveGlide === stop) stopActiveGlide = null;
  };
  const step = (now: number) => {
    const t = Math.min((now - start) / EXPAND_DURATION_MS, 1);
    const target = delta * easeOutQuint(t);
    window.scrollBy(0, target - applied);
    applied = target;
    if (t < 1) {
      frame = requestAnimationFrame(step);
    } else {
      stop();
    }
  };
  frame = requestAnimationFrame(step);
  for (const type of SCROLL_ABORT_EVENTS) {
    window.addEventListener(type, stop, { passive: true });
  }
  stopActiveGlide = stop;
}

// The item's viewport top in the settled layout: its current top minus every
// other expandable above it, which is collapsing and will be gone.
function settledItemTop(root: HTMLElement | null, item: HTMLElement): number {
  const itemTop = item.getBoundingClientRect().top;
  let collapsing = 0;
  if (root) {
    for (const el of root.querySelectorAll<HTMLElement>('[data-expandable]')) {
      if (item.contains(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.top < itemTop) collapsing += r.height;
    }
  }
  return itemTop - collapsing;
}

// Run once the element has a box to measure. A list can mount inside a hidden
// container — a page still mid-transition — where every rect is zero and a
// scroll computed from one would be meaningless.
function whenLaidOut(element: HTMLElement, run: () => void): () => void {
  if (element.getBoundingClientRect().height > 0) {
    run();
    return () => {};
  }

  const observer = new ResizeObserver(() => {
    if (element.getBoundingClientRect().height === 0) return;
    observer.disconnect();
    run();
  });
  observer.observe(element);
  return () => observer.disconnect();
}

/**
 * Scrolls the expanded item in a window-scrolled list to a comfortable
 * resting place, gliding in step with `EinExpandable`'s height transition.
 *
 * The consumer marks every item with `data-expanded` ("true" on the expanded
 * one) inside the element `rootRef` is attached to, gives the items the
 * `scroll-margin` to keep from the header and viewport edges, and passes
 * `onExpand` to the item's `EinExpandable`. A deep link (already expanded on
 * first render, no enter transition coming) is placed on mount, through
 * `scrollToItem` where there is one, except on back/forward, where the
 * browser restores the scroll.
 */
export function useScrollToExpanded({
  expandedKey,
  scrollToItem,
}: {
  // Identifies the expanded item (undefined when nothing is). Changes drive
  // the deep-link/out-of-window handling.
  expandedKey: string | undefined;
  // Bring the expanded item into the rendered window when it isn't in the
  // DOM (e.g. a virtualizer hasn't mounted it), its top at the given offset
  // from the viewport top. Must be referentially stable.
  scrollToItem?: (top: number) => void;
}): {
  rootRef: RefObject<HTMLDivElement | null>;
  onExpand: (expandable: HTMLElement, contentHeight: number) => void;
} {
  const rootRef = useRef<HTMLDivElement>(null);
  // Read when the list mounts: back/forward leaves the scroll to the browser,
  // which restores it.
  const { navigationType } = useNavigation();
  const navigationTypeRef = useRef(navigationType);
  navigationTypeRef.current = navigationType;

  // Cleared once the arrival placement has run, not when it is scheduled: an
  // effect cleaned up before its frame (Strict Mode, a quick re-render) leaves
  // it to the next run.
  const arrivalPending = useRef(true);
  useLayoutEffect(() => {
    if (!expandedKey) {
      arrivalPending.current = false;
      return;
    }

    const root = rootRef.current;
    let cancelled = false;

    // A virtualizer corrects its own scroll over the following frames, so the
    // hold outlasts the call that starts it.
    const holdScrollDirection = () => {
      const releaseScrollDirection = suspendScrollDirection();
      animationFrame(2).then(releaseScrollDirection, releaseScrollDirection);
    };

    // A page arrived at starts at the top, so the item is placed as it sits
    // there, and the page goes back to the top when it fits.
    const placeOnArrival = () => {
      const item = root?.querySelector<HTMLElement>('[data-expanded="true"]');
      if (cancelled || !item) return;
      arrivalPending.current = false;
      holdScrollDirection();

      const bounds = restingBounds(item);
      const rect = item.getBoundingClientRect();
      const topAtPageTop = rect.top + window.scrollY;
      const placement = placeExpanded(topAtPageTop, rect.height, bounds);
      if (placement.mode === 'keep') {
        window.scrollTo(0, 0);
        return;
      }
      // The item is in the DOM but its offset is not final: the server renders
      // every row, and the virtualizer then swaps the ones outside its window
      // for estimated spacers. Scrolling by a delta measured now lands further
      // off the further down the list the item is, so where the consumer has a
      // measuring scroll of its own, the placement is its job.
      if (scrollToItem) {
        scrollToItem(placementTop(placement, bounds));
      } else {
        window.scrollTo(0, topAtPageTop - placementTop(placement, bounds));
      }
    };

    const place = () => {
      const item = root?.querySelector<HTMLElement>('[data-expanded="true"]');
      if (!item) {
        arrivalPending.current = false;
        holdScrollDirection();
        // Items share their scroll margin, so an unmounted one borrows any
        // mounted item's.
        scrollToItem?.(
          restingBounds(root?.querySelector('[data-expanded]')).top,
        );
        return;
      }
      if (!arrivalPending.current) return;
      if (navigationTypeRef.current === 'native') {
        arrivalPending.current = false;
        return;
      }
      // The commit that mounts the list is not the settled layout (the
      // virtualizer has yet to measure), so the placement waits a frame.
      animationFrame(1).then(placeOnArrival);
    };

    if (!root) {
      place();
      return () => {
        cancelled = true;
      };
    }
    const stopWaiting = whenLaidOut(root, place);
    return () => {
      cancelled = true;
      stopWaiting();
    };
  }, [expandedKey, scrollToItem]);

  const onExpand = useCallback(
    (expandable: HTMLElement, contentHeight: number) => {
      const item = expandable.closest<HTMLElement>('[data-expanded="true"]');
      if (!item) return;
      // The expandable is still at `height: 0`, so the item's rect is the
      // collapsed row alone.
      const top = settledItemTop(rootRef.current, item);
      const itemHeight = item.getBoundingClientRect().height + contentHeight;
      const bounds = restingBounds(item);
      const placement = placeExpanded(top, itemHeight, bounds);
      smoothScrollBy(top - placementTop(placement, bounds));
    },
    [],
  );

  return { rootRef, onExpand };
}
