import { useRef } from 'react';

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
 * Determines whether a list of dependencies has changed since last render
 *
 * @param deps list of dependencies
 * @returns Whether the dependencies have changed
 */
export default function useIsChanged(deps: unknown[], treatInitialAsUnchanged = false) {
  const previousDeps = useRef<unknown[] | null>(treatInitialAsUnchanged ? deps : null);
  if (
    previousDeps.current === null ||
    !compareDeps(previousDeps.current, deps)
  ) {
    previousDeps.current = [...deps];
    return true;
  }
  return false;
}
