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

const readScrollY = () => window.scrollY ?? window.pageYOffset ?? 0;

const readIsAtTop = (y: number) => y <= 0;

const readIsAtBottom = (y: number) => {
  const scrollHeight = document.documentElement.scrollHeight;
  return window.innerHeight + y >= scrollHeight - EPSILON_PX;
};

// Module-level state
let lastY = IS_BROWSER ? readScrollY() : 0;
let isAtTop = IS_BROWSER ? readIsAtTop(lastY) : true;
let isAtBottom = IS_BROWSER ? readIsAtBottom(lastY) : false;

let isQueued = false;
let rafId: number | null = null;
const subscribers = new Set<Subscriber>();

const handleScroll = () => {
  isQueued = false;
  rafId = null;

  const y = readScrollY();
  const newIsAtTop = readIsAtTop(y);
  const newIsAtBottom = readIsAtBottom(y);

  const delta = y - lastY;
  if (delta === 0 && newIsAtTop === isAtTop && newIsAtBottom === isAtBottom) {
    lastY = y;
    return;
  }

  const absoluteDelta = Math.abs(delta);
  const direction: Exclude<LastScrollDirection, 'none'> | null =
    delta === 0 ? null : delta > 0 ? 'down' : 'up';

  subscribers.forEach((subscriber) => {
    if (newIsAtTop !== isAtTop) subscriber.setIsAtTop(newIsAtTop);
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

  isAtTop = newIsAtTop;
  isAtBottom = newIsAtBottom;
  lastY = y;
};

const queueHandleScroll = () => {
  if (!isQueued) {
    isQueued = true;
    rafId = requestAnimationFrame(handleScroll);
  }
};

const addListener = (subscriber: Subscriber) => {
  if (!IS_BROWSER) return;

  subscribers.add(subscriber);

  if (subscribers.size === 1) {
    // Sync globals to *current* reality before we start emitting
    lastY = readScrollY();
    isAtTop = readIsAtTop(lastY);
    isAtBottom = readIsAtBottom(lastY);

    window.addEventListener('scroll', queueHandleScroll, { passive: true });
    window.addEventListener('resize', queueHandleScroll, { passive: true });
  }

  subscriber.setIsAtTop(isAtTop);
  subscriber.setIsAtBottom(isAtBottom);
};

const removeListener = (subscriber: Subscriber) => {
  subscribers.delete(subscriber);
  if (subscribers.size === 0) {
    window.removeEventListener('scroll', queueHandleScroll);
    window.removeEventListener('resize', queueHandleScroll);

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
  const [isAtTopState, setIsAtTopState] = useState(isAtTop);
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
    // Snap local state to the real values at mount time
    if (IS_BROWSER) {
      const y = readScrollY();
      setIsAtTopState(readIsAtTop(y));
      setIsAtBottomState(readIsAtBottom(y));
    }

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
