import {
  type HTMLAttributes,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import cn from '~/lib/utils/className';
import styles from './EinVirtualScroller.module.scss';

type EinVirtualScrollerProps<T> = {
  items: T[];
  renderItem: (
    item: T,
    index: number,
    ref: (el: HTMLLIElement | null) => void,
  ) => React.ReactNode;
  renderMargin?: number;
  estimatedItemHeight?: number;
} & HTMLAttributes<HTMLUListElement>;

export function EinVirtualScroller<T>({
  className,
  items,
  renderItem,
  renderMargin = 20,
  estimatedItemHeight: _estimatedItemHeight = 50,
  ...rest
}: EinVirtualScrollerProps<T>) {
  const containerRef = useRef<HTMLUListElement>(null);
  const topPaddingRef = useRef<HTMLLIElement>(null);
  const bottomPaddingRef = useRef<HTMLLIElement>(null);
  const renderedItemsRef = useRef<Map<number, HTMLLIElement>>(new Map());
  const itemHeightsRef = useRef<Map<number, number>>(new Map());
  const containerHeightRef = useRef<number>(0);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const [visibleRange, setVisibleRange] = useState({
    start: 0,
    end: renderMargin * 2,
  });
  const [topPadding, setTopPadding] = useState(0);
  const [bottomPadding, setBottomPadding] = useState(0);
  const [estimatedItemHeight, setEnhetListimatedItemHeight] =
    useState(_estimatedItemHeight);

  // Get height of an item (use measured height or estimated)
  const getItemHeight = useCallback(
    (index: number): number => {
      return itemHeightsRef.current.get(index) ?? estimatedItemHeight;
    },
    [estimatedItemHeight],
  );

  // Calculate total height of items in a range
  const getTotalHeight = useCallback(
    (startIndex: number, endIndex: number): number => {
      let height = 0;
      for (let i = startIndex; i < endIndex; i++) {
        height += getItemHeight(i);
      }
      return height;
    },
    [getItemHeight],
  );

  // Calculate which items should be visible based on scroll position
  const calculateVisibleRange = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const scrollBottom = scrollTop + containerHeight;

    let currentTop = 0;
    let start = 0;
    let end = items.length;
    let startFound = false;

    // Find first visible item
    for (let i = 0; i < items.length; i++) {
      const itemHeight = getItemHeight(i);
      if (!startFound && currentTop + itemHeight > scrollTop) {
        start = Math.max(0, i - renderMargin);
        startFound = true;
      }

      if (startFound && currentTop > scrollBottom) {
        end = Math.min(items.length, i + renderMargin);
        break;
      }

      currentTop += itemHeight;
    }

    if (visibleRange.start === start && visibleRange.end === end) {
      return;
    }

    // Calculate padding heights
    const topHeight = getTotalHeight(0, start);
    const bottomHeight = getTotalHeight(end, items.length);

    setVisibleRange({ start, end });
    setTopPadding(topHeight);
    setBottomPadding(bottomHeight);
  }, [items.length, renderMargin, getItemHeight, getTotalHeight, visibleRange]);

  // Setup ResizeObserver for items
  useEffect(() => {
    resizeObserverRef.current = new ResizeObserver((entries) => {
      let needsRecalc = false;

      for (const entry of entries) {
        const target = entry.target as HTMLElement;
        const index = parseInt(target.dataset.index ?? '-1', 10);

        if (index >= 0) {
          const newHeight =
            entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
          const oldHeight = itemHeightsRef.current.get(index);

          if (oldHeight !== newHeight) {
            itemHeightsRef.current.set(index, newHeight);
            needsRecalc = true;
          }
        }
      }

      if (needsRecalc) {
        calculateVisibleRange();
      }
    });

    return () => {
      resizeObserverRef.current?.disconnect();
    };
  }, [calculateVisibleRange]);

  // Setup IntersectionObserver for padding divs
  useEffect(() => {
    const topPadding = topPaddingRef.current;
    const bottomPadding = bottomPaddingRef.current;
    const container = containerRef.current;

    if (!topPadding || !bottomPadding || !container) {
      return;
    }

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            calculateVisibleRange();
          }
        }
      },
      {
        root: container,
        rootMargin: `100px`,
        threshold: 0,
      },
    );

    intersectionObserver.observe(topPadding);
    intersectionObserver.observe(bottomPadding);

    return () => {
      intersectionObserver.disconnect();
    };
  }, [calculateVisibleRange]);

  // Setup container resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerResizeObserver = new ResizeObserver((entries) => {
      let needsRecalc = false;
      for (const entry of entries) {
        if (containerHeightRef.current !== entry.contentRect.height) {
          containerHeightRef.current = entry.contentRect.height;
          needsRecalc = true;
          break;
        }
      }
      if (needsRecalc) {
        calculateVisibleRange();
      }
    });

    containerResizeObserver.observe(container);

    return () => {
      containerResizeObserver.disconnect();
    };
  }, [calculateVisibleRange]);

  // Initial calculation and recalculation when list changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: required in calculateVisibleRange
  useEffect(() => {
    calculateVisibleRange();
  }, [items.length]);

  // Update scrollTop if we're scrolling up and the rendered item has changed height
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let heightDiff = 0;
    for (
      let i = visibleRange.start;
      i < visibleRange.start + renderMargin;
      i++
    ) {
      const prevHeight = getItemHeight(i);
      const currentHeight =
        renderedItemsRef.current.get(i)?.offsetHeight ?? estimatedItemHeight;
      const thisDiff = currentHeight - prevHeight;
      if (Math.abs(thisDiff) > 0) {
        itemHeightsRef.current.set(i, currentHeight);
        heightDiff += currentHeight - prevHeight;
      }
    }

    if (heightDiff !== 0) {
      container.scrollTop += heightDiff;
    }
  }, [estimatedItemHeight, getItemHeight, visibleRange, renderMargin]);

  // Scroll to top when items change
  // biome-ignore lint/correctness/useExhaustiveDependencies: ...
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTop = 0;
    }
  }, [items]);

  // Render visible items
  const visibleItems = [];
  for (let i = visibleRange.start; i < visibleRange.end; i++) {
    if (i >= 0 && i < items.length) {
      visibleItems.push(
        renderItem(items[i], i, (el) => {
          const observer = resizeObserverRef.current;
          if (el) {
            renderedItemsRef.current.set(i, el);
            observer?.observe(el);
          } else {
            const oldEl = renderedItemsRef.current.get(i);
            if (oldEl && observer) {
              observer.unobserve(oldEl);
            }
            renderedItemsRef.current.delete(i);
          }
        }),
      );
    }
  }

  return (
    <ul
      // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: tabIndex is set
      role="listbox"
      tabIndex={0}
      aria-multiselectable="true"
      className={cn(className, styles.virtualScroller)}
      ref={containerRef}
      {...rest}
    >
      <li
        className={styles.paddingTop}
        ref={topPaddingRef}
        style={{ height: `${topPadding}px` }}
      />
      {visibleItems}
      <li
        className={styles.paddingBottom}
        ref={bottomPaddingRef}
        style={{ height: `${bottomPadding}px` }}
      />
    </ul>
  );
}
