import { useEffect, useState } from 'react';

// This should be synced with mediaQueries.scss
const Breakpoints = {
  SM: [0, 767] as [number, number],
  MD: [768, 1299] as [number, number],
  LG: [1300, Number.POSITIVE_INFINITY] as [number, number],
};
export type BreakpointName = keyof typeof Breakpoints;

const isClient = typeof window !== 'undefined';

// Check a breakpoint against the current window size
const checkMatch = (breakpoint: [number, number]): boolean => {
  const currentWidth = getCurrentWidth();
  return currentWidth >= breakpoint[0] && currentWidth <= breakpoint[1];
};

// Get the current document width
const getCurrentWidth = () => {
  if (!isClient) {
    return 0;
  }
  return document.documentElement.clientWidth;
};

/**
 * Checks if the desired breakpoint is larger or smaller than the current window.innerWidth.
 * @param breakpoint The target breakpoint size
 * @returns A boolean indicating whether the current window size matches the breakpoint
 */
export default function useBreakpoint(breakpointName: BreakpointName) {
  const breakpoint = Breakpoints[breakpointName];

  // Set the initial state based on the current window size
  const [isMatching, setIsMatching] = useState(
    () => isClient && checkMatch(breakpoint),
  );

  // Update the state when the window is resized
  useEffect(() => {
    if (!isClient) {
      return;
    }

    const resizeObserver = new ResizeObserver(() =>
      setIsMatching(checkMatch(breakpoint)),
    );
    resizeObserver.observe(document.documentElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [breakpoint]);

  return isMatching;
}
