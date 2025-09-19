import { useEffect, useMemo, useRef } from 'react';

type ChangedDeps<T extends readonly unknown[]> = {
  current: T;
  previous: T | undefined;
} | null;

/**
 * Performs a shallow comparison of two arrays.
 * @param a
 * @param b
 * @returns `true` if the arrays are the same length and their elements are equal according to `Object.is`, otherwise `false`.
 */
const compareDeps = (a: readonly unknown[], b: readonly unknown[]) => {
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
 * @param treatInitialAsUnchanged If true, first render returns null instead of a change object.
 * @returns Object with { current, previous } when changed, otherwise null.
 */
export default function useIsChanged<T extends readonly unknown[]>(
  deps: T,
  treatInitialAsUnchanged = false,
): ChangedDeps<T> {
  const prevRef = useRef<T | undefined>(undefined);
  const prev = prevRef.current;
  const isChanged = prev ? !compareDeps(prev, deps) : !treatInitialAsUnchanged;

  useEffect(() => {
    prevRef.current = deps;
  });

  return isChanged
    ? {
        current: deps,
        previous: prevRef.current,
      }
    : null;
}
