import { useEffect, useRef } from 'react';
import useIsMounted from './useIsMounted';

/**
 * Performs a shallow comparison of two arrays.
 * @param a
 * @param b
 * @returns `true` if the arrays are the same length and their elements are equal according to `Object.is`, otherwise `false`.
 */
const compareDeps = (a: unknown[], b: unknown[]) => {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) {
      return false;
    }
  }
  return true;
};

/**
 * A custom hook that determines if a dependency array has changed value since the last render.
 * It performs a shallow comparison of the elements in the dependency array.
 *
 * @param deps The array of dependencies to track for changes.
 * @param treatInitialAsUnchanged If `true`, the hook will return `false` on the initial render.
 *   Defaults to `false`, meaning the initial state is considered a "change".
 * @returns `true` if the `deps` array's contents have changed since the previous commit, otherwise `false`.
 */
export default function useIsChanged(
  deps: unknown[],
  treatInitialAsUnchanged = false,
) {
  const previousDepsRef = useRef<unknown[] | undefined>(undefined);

  useEffect(() => {
    previousDepsRef.current = deps;
  });

  if (previousDepsRef.current === undefined) {
    return !treatInitialAsUnchanged;
  }

  return !compareDeps(previousDepsRef.current, deps);
}
