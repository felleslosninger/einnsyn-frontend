import { useEffect, useRef } from 'react';

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

export default function useIsChanged(
  deps: unknown[],
  treatInitialAsUnchanged = false,
) {
  // Make "previousDeps" an unique symbol initially if it should be treated as changed
  const previousDepsRef = useRef<unknown[]>(
    treatInitialAsUnchanged ? [...deps] : [Symbol('initial')],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies:
  useEffect(() => {
    previousDepsRef.current = [...deps];
  }, deps);

  return !compareDeps(previousDepsRef.current, deps);
}
