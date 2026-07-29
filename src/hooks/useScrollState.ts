'use client';

import { useEffect, useRef, useState } from 'react';
import { IS_BROWSER } from '~/lib/isBrowser';

type Props = {
  threshold?: number; // Fallback threshold if direction thresholds are not set
  scrollDownThreshold?: number;
  scrollUpThreshold?: number;
  onScrollDown?: () => void; // Callback fired when direction changes to down
  onScrollUp?: () => void; // Callback fired when direction changes to up
};

type LastScrollDirection = 'up' | 'down' | 'none';

type Subscriber = {
  setScrollDirection: (direction: LastScrollDirection) => void;
  setIsAtTop: (isAtTop: boolean) => void;
  setIsAtBottom: (isAtBottom: boolean) => void;

  scrollDownThreshold: number;
  scrollUpThreshold: number;

  onScrollDown?: () => void;
  onScrollUp?: () => void;

  committedDirection: LastScrollDirection;
  currentDirection: LastScrollDirection | null;
  accumulatedDistance: number;
};

const EPSILON_PX = 1;

// How much a same-frame document-height change may EXCEED the scroll move and
// still be read as scroll anchoring (content inserted above the scroll position)
// rather than content appended below it. See handleScroll.
//
// The two cases aren't formally separable: `heightDelta = above + below` and
// `rawDelta = above + user` is two equations in three unknowns, so a prepend of H
// with the user scrolling up by `u` reads identically to an append of H with the
// user scrolling down by `H - u`. What separates them in practice is scale — a
// paged insert is hundreds to thousands of px, a single frame of user scroll is
// tens. This is sized above a fling (~150px/frame) and far below a page insert.
// The residual ambiguity is a prepend landing in the same frame as a >200px user
// scroll (keyboard paging), which then reads at face value.
const MAX_ANCHOR_SHIFT_SLACK_PX = 200;

const getScrollRoot = () =>
  document.scrollingElement ?? document.documentElement ?? document.body;

const readScrollY = () => {
  const scrollRoot = getScrollRoot();
  if (scrollRoot) {
    return scrollRoot.scrollTop;
  }

  return (
    window.scrollY ??
    window.pageYOffset ??
    document.documentElement.scrollTop ??
    0
  );
};

const readViewportHeight = () =>
  window.visualViewport?.height ?? window.innerHeight;

const readScrollHeight = () => document.documentElement.scrollHeight;

const readIsAtTop = (y: number) => y <= EPSILON_PX;

const readIsAtBottom = (y: number) => {
  const scrollHeight = document.documentElement.scrollHeight;
  return readViewportHeight() + y >= scrollHeight - EPSILON_PX;
};

// Module-level state
let lastY = IS_BROWSER ? readScrollY() : 0;
let isAtTop = IS_BROWSER ? readIsAtTop(lastY) : true;
let isAtBottom = IS_BROWSER ? readIsAtBottom(lastY) : false;
// Last sampled document height, used to discount scroll movement caused by the
// document reflowing (content paging into a virtualized list) rather than the
// user. See handleScroll.
let lastScrollHeight = IS_BROWSER ? readScrollHeight() : 0;
// When an infinite list still has content to load ABOVE the current top,
// scrollTop 0 isn't the real top — reaching it would otherwise read as "at top"
// and then bounce back the instant the content pages in and pushes the page
// down. While provisional, subscribers see `isAtTop: false` so they hold their
// scrolled state across the load. Set via setTopBoundaryProvisional.
let topBoundaryProvisional = false;
// The at-top value last broadcast to subscribers (raw isAtTop gated by the
// provisional flag), tracked so a flag change only re-pushes on a real flip.
let effectiveAtTop = isAtTop && !topBoundaryProvisional;

let isQueued = false;
let rafId: number | null = null;
const subscribers = new Set<Subscriber>();

// Recompute the gated at-top value and push it to subscribers if it flipped.
// Called both on scroll (raw isAtTop changed) and when the provisional flag
// toggles, so the two inputs stay reconciled from one place.
const syncEffectiveAtTop = () => {
  const next = isAtTop && !topBoundaryProvisional;
  if (next === effectiveAtTop) return;
  effectiveAtTop = next;
  subscribers.forEach((subscriber) => {
    subscriber.setIsAtTop(next);
  });
};

// Mark (or clear) the document's top as provisional — an infinite list has more
// content to load above the current top. Generic to the scroll system; the
// caller owns the truth (e.g. a windowed list with a previous-page cursor).
export const setTopBoundaryProvisional = (provisional: boolean) => {
  if (topBoundaryProvisional === provisional) return;
  topBoundaryProvisional = provisional;
  syncEffectiveAtTop();
};

const handleScroll = () => {
  isQueued = false;
  rafId = null;

  const y = readScrollY();
  const newIsAtTop = readIsAtTop(y);
  const newIsAtBottom = readIsAtBottom(y);

  // Discount scroll movement that's really the document reflowing under the
  // viewport, not the user. When content is inserted/removed ABOVE the scroll
  // position, the scroll offset shifts by the same amount and the same direction
  // to keep the visible content in place — so scrollHeight and scrollTop CO-MOVE.
  // That co-movement is what we test for: the height change has to be no larger
  // than the scroll move (plus slack for genuine scrolling mixed into the same
  // frame) before we treat it as such a shift and subtract it — never past zero,
  // so a real scroll in the same frame still reads through.
  //
  // A height change much LARGER than the scroll move is content added below the
  // viewport (appending the next page), which doesn't move scrollTop at all, so
  // the delta is left alone. Without that check a 20px user scroll landing in the
  // same frame as a 2400px append would be zeroed out, and the direction never
  // committed — which is exactly what happens on the search page, whose results
  // append as you scroll down.
  //
  // The subtraction works only because the list disables native scroll anchoring
  // (overflow-anchor: none), so Virtua's own shift is the sole scrollTop adjuster
  // and it lands in the same frame as the height change rather than the browser
  // anchoring scrollTop a frame later.
  const scrollHeight = readScrollHeight();
  const heightDelta = scrollHeight - lastScrollHeight;
  lastScrollHeight = scrollHeight;

  const rawDelta = y - lastY;
  let delta = rawDelta;
  if (
    heightDelta !== 0 &&
    Math.sign(heightDelta) === Math.sign(rawDelta) &&
    Math.abs(heightDelta) <= Math.abs(rawDelta) + MAX_ANCHOR_SHIFT_SLACK_PX
  ) {
    delta =
      Math.sign(rawDelta) *
      Math.max(0, Math.abs(rawDelta) - Math.abs(heightDelta));
  }

  if (delta === 0 && newIsAtTop === isAtTop && newIsAtBottom === isAtBottom) {
    lastY = y;
    return;
  }

  const absoluteDelta = Math.abs(delta);
  const direction: Exclude<LastScrollDirection, 'none'> | null =
    delta === 0 ? null : delta > 0 ? 'down' : 'up';

  // Push at-top through the provisional gate (a separate broadcast, since the
  // gated value is shared across subscribers and can also change off-scroll).
  isAtTop = newIsAtTop;
  syncEffectiveAtTop();

  subscribers.forEach((subscriber) => {
    if (newIsAtBottom !== isAtBottom) subscriber.setIsAtBottom(newIsAtBottom);

    if (!direction) return;

    if (direction === subscriber.currentDirection) {
      subscriber.accumulatedDistance += absoluteDelta;
    } else {
      subscriber.currentDirection = direction;
      subscriber.accumulatedDistance = absoluteDelta;
    }

    if (
      direction === 'down' &&
      subscriber.committedDirection !== 'down' &&
      subscriber.accumulatedDistance >= subscriber.scrollDownThreshold
    ) {
      subscriber.accumulatedDistance = subscriber.scrollDownThreshold;
      subscriber.committedDirection = 'down';
      subscriber.setScrollDirection('down');
      subscriber.onScrollDown?.();
    }

    if (
      direction === 'up' &&
      subscriber.committedDirection !== 'up' &&
      subscriber.accumulatedDistance >= subscriber.scrollUpThreshold
    ) {
      subscriber.accumulatedDistance = subscriber.scrollUpThreshold;
      subscriber.committedDirection = 'up';
      subscriber.setScrollDirection('up');
      subscriber.onScrollUp?.();
    }

    subscriber.accumulatedDistance = Math.min(
      subscriber.accumulatedDistance,
      Math.max(subscriber.scrollDownThreshold, subscriber.scrollUpThreshold),
    );
  });

  isAtBottom = newIsAtBottom;
  lastY = y;
};

const queueHandleScroll = () => {
  if (!isQueued) {
    isQueued = true;
    rafId = requestAnimationFrame(handleScroll);
  }
};

const addScrollListeners = () => {
  // Document dispatches the page/viewport scroll event; the scrollingElement
  // is still the right place to read scrollTop from.
  document.addEventListener('scroll', queueHandleScroll, {
    passive: true,
  });
  window.addEventListener('resize', queueHandleScroll, { passive: true });
  window.visualViewport?.addEventListener('resize', queueHandleScroll, {
    passive: true,
  });
};

const removeScrollListeners = () => {
  document.removeEventListener('scroll', queueHandleScroll);
  window.removeEventListener('resize', queueHandleScroll);
  window.visualViewport?.removeEventListener('resize', queueHandleScroll);
};

const addListener = (subscriber: Subscriber) => {
  if (!IS_BROWSER) return;

  subscribers.add(subscriber);

  if (subscribers.size === 1) {
    // Sync globals to *current* reality before we start emitting
    lastY = readScrollY();
    isAtTop = readIsAtTop(lastY);
    isAtBottom = readIsAtBottom(lastY);
    lastScrollHeight = readScrollHeight();
    effectiveAtTop = isAtTop && !topBoundaryProvisional;

    addScrollListeners();
  }

  // Seed with the gated at-top so a freshly mounted consumer agrees with the
  // provisional flag instead of briefly reading raw scrollTop 0 as the top.
  subscriber.setIsAtTop(effectiveAtTop);
  subscriber.setIsAtBottom(isAtBottom);
};

const removeListener = (subscriber: Subscriber) => {
  subscribers.delete(subscriber);
  if (subscribers.size === 0) {
    removeScrollListeners();

    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    isQueued = false;
  }
};

/**
 * Hook that returns the scroll direction of the last significant scroll event.
 * A direction change is only committed after the cumulative movement in the new
 * direction meets its threshold.
 */
export const useScrollState = ({
  threshold = 50,
  scrollDownThreshold = threshold,
  scrollUpThreshold = threshold,
  onScrollDown,
  onScrollUp,
}: Props = {}) => {
  const [scrollDirection, setScrollDirection] =
    useState<LastScrollDirection>('none');
  // Seed from the GATED at-top (raw at-top ∧ not provisional) — the same value
  // addListener will push below — so the very first render already agrees with
  // the provisional gate instead of briefly reading scrollTop 0 as the real top.
  const [isAtTopState, setIsAtTopState] = useState(effectiveAtTop);
  const [isAtBottomState, setIsAtBottomState] = useState(isAtBottom);

  // We use a ref to store the subscriber so that we don't need to remove and re-add
  // the listener every time the callbacks or thresholds change (which would reset
  // the accumulated distance).
  const subscriberRef = useRef<Subscriber>({
    setScrollDirection,
    setIsAtTop: setIsAtTopState,
    setIsAtBottom: setIsAtBottomState,
    scrollDownThreshold,
    scrollUpThreshold,
    onScrollDown,
    onScrollUp,
    committedDirection: 'none',
    currentDirection: null,
    accumulatedDistance: 0,
  });

  useEffect(() => {
    // Sync ref configuration with current props on every render
    const sub = subscriberRef.current;
    sub.scrollDownThreshold = scrollDownThreshold;
    sub.scrollUpThreshold = scrollUpThreshold;
    sub.onScrollDown = onScrollDown;
    sub.onScrollUp = onScrollUp;
  });

  useEffect(() => {
    // No separate "snap to reality" pass: addListener re-syncs the module globals
    // from the live DOM when this is the first subscriber, then seeds this
    // consumer from them — and it seeds at-top through the provisional gate,
    // which a raw re-read here would bypass.
    const subscriber = subscriberRef.current;
    addListener(subscriber);

    return () => removeListener(subscriber);
  }, []);

  return {
    scrollDirection,
    isScrollingDown: scrollDirection === 'down',
    isScrollingUp: scrollDirection === 'up',
    hasScrolled: scrollDirection !== 'none',
    isAtTop: isAtTopState,
    isAtBottom: isAtBottomState,
  };
};
