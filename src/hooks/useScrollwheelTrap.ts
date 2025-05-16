import type { RefObject } from 'react';
import { useEffect } from 'react';

/**
 * Check if an element or any of its parents up to a given container node will be
 * scrolled by a scroll event.
 *
 * @param element Scroll event's target
 * @param scrollDiff pixels in Y direction
 * @param container Check up to this element
 */
const isScrollable = (
  element: HTMLElement | null,
  scrollDiff: number,
  container = element,
): boolean => {
  const scrollingUp = scrollDiff < 0;
  const scrollingDown = scrollDiff > 0;

  if (!element) {
    return false;
  }

  const style = window.getComputedStyle(element);
  const isOverflowScrollable = style.overflowY === 'auto' || style.overflowY === 'scroll';

  if (isOverflowScrollable && element.scrollHeight > element.clientHeight) {
    if (
      (scrollingUp && element.scrollTop > 0) ||
      (scrollingDown &&
        element.scrollTop + element.clientHeight + 1 < element.scrollHeight)
    ) {
      return true;
    }
  }

  if (element === container) {
    return false;
  }

  return isScrollable(element.parentElement, scrollDiff, container);
};

/**
 * This hook will disable the scroll wheel outside the given container.
 *
 * @param containerRef Container
 * @param enabled Whether to enable the scrollwheel trap
 */
export function useScrollwheelTrap(
  containerRef: RefObject<HTMLElement | null>,
  enabled?: boolean,
): void {
  // Disable scrollwheel outside EinModal
  useEffect(() => {
    const containerDOM = containerRef.current;

    if (enabled && containerDOM) {
      let tStart = 0;

      // Disable scrollwheel if target is outside container, or if
      // target is not scrollable in the direction of the scroll
      const maybePreventDefault = (e: WheelEvent | TouchEvent) => {
        const target = e.target as HTMLElement;
        const deltaY =
          e instanceof WheelEvent
            ? e.deltaY
            : tStart - (e.changedTouches[0]?.clientY ?? 0);
        if (
          containerDOM &&
          (!containerDOM.contains(target) ||
            !isScrollable(target, deltaY, containerDOM))
        ) {
          e.preventDefault();
        }
      };

      const start = (e: TouchEvent) => {
        tStart = e.targetTouches[0]?.clientY ?? 0;
      };

      document.addEventListener('touchstart', start, { passive: false });
      document.addEventListener('touchmove', maybePreventDefault, {
        passive: false,
      });
      document.addEventListener('wheel', maybePreventDefault, {
        passive: false,
      });

      return () => {
        document.removeEventListener('touchstart', start);
        document.removeEventListener('touchmove', maybePreventDefault);
        document.removeEventListener('wheel', maybePreventDefault);
      };
    }
  }, [enabled, containerRef]);
}
