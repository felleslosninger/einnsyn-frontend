import { type RefObject, useCallback, useLayoutEffect, useRef } from 'react';
import { EXPAND_DURATION_MS } from '~/components/EinExpandable/EinExpandable';
import { suspendScrollDirection } from '~/hooks/useScrollState';
import { animationFrame } from '~/lib/utils/animationFrame';

// Gap between the expanded item and the header/viewport edges.
const SCROLL_GAP_PX = 16;
// User input cancels the scroll glide. The click that started the expansion
// fired its pointerdown before the listener goes on.
const SCROLL_ABORT_EVENTS = ['wheel', 'pointerdown', 'keydown'] as const;

// First usable pixel below the site header (the first out-of-flow <header>).
// Measured live: the header shrinks on scroll, and `--ein-header-height` is
// declared but no longer written.
function stickyHeaderInset(): number {
  for (const el of document.querySelectorAll('header')) {
    const { position } = getComputedStyle(el);
    if (position === 'fixed' || position === 'sticky') {
      return el.getBoundingClientRect().height + SCROLL_GAP_PX;
    }
  }
  return SCROLL_GAP_PX;
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
  inset: number,
): Placement {
  const bottomLimit = window.innerHeight - SCROLL_GAP_PX;
  if (inset + itemHeight > bottomLimit) return { mode: 'top' };
  if (currentTop < inset) return { mode: 'top' };
  if (currentTop + itemHeight > bottomLimit) {
    return { mode: 'bottom', itemHeight };
  }
  return { mode: 'keep', top: currentTop };
}

function placementTop(placement: Placement, inset: number): number {
  if (placement.mode === 'top') return inset;
  if (placement.mode === 'bottom') {
    return Math.max(
      inset,
      window.innerHeight - SCROLL_GAP_PX - placement.itemHeight,
    );
  }
  return Math.max(inset, placement.top);
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
 * The consumer marks the expanded item with `data-expanded` inside the
 * element `rootRef` is attached to, and passes `onExpand` to the item's
 * `EinExpandable`. A deep link (already expanded on first render, no enter
 * transition coming) is placed on mount, through `scrollToItem` where there
 * is one.
 */
export function useScrollToExpanded({
  expandedKey,
  scrollToItem,
}: {
  // Identifies the expanded item (undefined when nothing is). Changes drive
  // the deep-link/out-of-window handling.
  expandedKey: string | undefined;
  // Bring the expanded item into the rendered window when it isn't in the
  // DOM (e.g. a virtualizer hasn't mounted it), offset by the given header
  // inset. Must be referentially stable.
  scrollToItem?: (headerInset: number) => void;
}): {
  rootRef: RefObject<HTMLDivElement | null>;
  onExpand: (expandable: HTMLElement, contentHeight: number) => void;
} {
  const rootRef = useRef<HTMLDivElement>(null);

  const initialPlacementPending = useRef(true);
  useLayoutEffect(() => {
    const isInitial = initialPlacementPending.current;
    initialPlacementPending.current = false;
    if (!expandedKey) return;

    const root = rootRef.current;

    const place = () => {
      // A virtualizer corrects its own scroll over the following frames, so the
      // hold outlasts the call that starts it.
      const releaseScrollDirection = suspendScrollDirection();
      animationFrame(2).then(releaseScrollDirection, releaseScrollDirection);

      const inset = stickyHeaderInset();
      const item = root?.querySelector<HTMLElement>('[data-expanded="true"]');
      if (!item) {
        scrollToItem?.(inset);
        return;
      }
      if (!isInitial) return;

      const rect = item.getBoundingClientRect();
      const placement = placeExpanded(rect.top, rect.height, inset);
      if (placement.mode === 'keep') return;
      // The item is in the DOM but its offset is not final: the server renders
      // every row, and the virtualizer then swaps the ones outside its window
      // for estimated spacers. Scrolling by a delta measured now lands further
      // off the further down the list the item is, so where the consumer has a
      // measuring scroll of its own, the placement is its job.
      if (scrollToItem) {
        scrollToItem(inset);
      } else {
        window.scrollBy(0, rect.top - placementTop(placement, inset));
      }
    };

    if (!root) {
      place();
      return;
    }
    return whenLaidOut(root, place);
  }, [expandedKey, scrollToItem]);

  const onExpand = useCallback(
    (expandable: HTMLElement, contentHeight: number) => {
      const item = expandable.closest<HTMLElement>('[data-expanded="true"]');
      if (!item) return;
      // The expandable is still at `height: 0`, so the item's rect is the
      // collapsed row alone.
      const top = settledItemTop(rootRef.current, item);
      const itemHeight = item.getBoundingClientRect().height + contentHeight;
      const inset = stickyHeaderInset();
      const placement = placeExpanded(top, itemHeight, inset);
      smoothScrollBy(top - placementTop(placement, inset));
    },
    [],
  );

  return { rootRef, onExpand };
}
