import { useEffect, useRef, useState } from 'react';

type Props = {
  threshold?: number; // Fallback threshold if direction thresholds are not set
  scrollDownThreshold?: number;
  scrollUpThreshold?: number;
  onScrollDown?: () => void; // Callback fired when direction changes to down
  onScrollUp?: () => void; // Callback fired when direction changes to up
};

type ScrollDirection = 'up' | 'down' | 'none';

/**
 * Hook that returns the scroll direction of the last significant scroll event.
 * A direction change is only committed after the cumulative movement in the new
 * direction meets its threshold.
 */
export const useScrollingDirection = ({
  threshold = 50,
  scrollDownThreshold = threshold,
  scrollUpThreshold = threshold,
  onScrollDown,
  onScrollUp,
}: Props = {}) => {
  const [scrollDirection, setScrollDirection] =
    useState<ScrollDirection>('none');
  const committedDirectionRef = useRef<ScrollDirection>(scrollDirection);
  const currentDirectionRef = useRef<ScrollDirection | null>(null);

  const accumulatedDistanceRef = useRef(0);
  const lastYRef = useRef(0);
  const isQueuedRef = useRef(false); // Mark when an animationFrame is queued

  useEffect(() => {
    lastYRef.current = window.scrollY;

    const evaluate = () => {
      isQueuedRef.current = false;
      const y = window.scrollY;
      const delta = y - lastYRef.current;
      if (delta === 0) {
        return;
      }

      const direction = delta > 0 ? 'down' : 'up';
      const absoluteDelta = Math.abs(delta);

      if (direction === currentDirectionRef.current) {
        // Continuing in same candidate direction; accumulate.
        accumulatedDistanceRef.current += absoluteDelta;
      } else {
        // Direction flipped; reset accumulation for new direction.
        currentDirectionRef.current = direction;
        accumulatedDistanceRef.current = absoluteDelta;
      }

      if (direction === 'down') {
        if (
          committedDirectionRef.current !== 'down' &&
          accumulatedDistanceRef.current >= scrollDownThreshold
        ) {
          accumulatedDistanceRef.current = scrollDownThreshold;
          committedDirectionRef.current = 'down';
          setScrollDirection('down');
          onScrollDown?.();
        }
      } else {
        if (
          committedDirectionRef.current !== 'up' &&
          accumulatedDistanceRef.current >= scrollUpThreshold
        ) {
          accumulatedDistanceRef.current = scrollUpThreshold;
          committedDirectionRef.current = 'up';
          setScrollDirection('up');
          onScrollUp?.();
        }
      }

      // Prevent unbounded growth when continuing same direction without a change.
      accumulatedDistanceRef.current = Math.min(
        accumulatedDistanceRef.current,
        Math.max(scrollDownThreshold, scrollUpThreshold),
      );

      lastYRef.current = y;
    };

    const onScroll = () => {
      if (!isQueuedRef.current) {
        isQueuedRef.current = true;
        requestAnimationFrame(evaluate);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [scrollDownThreshold, scrollUpThreshold, onScrollDown, onScrollUp]);

  return scrollDirection;
};
