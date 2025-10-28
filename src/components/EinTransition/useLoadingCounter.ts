import { useRef } from 'react';
import useIsChanged from '~/hooks/useIsChanged';

/**
 * Returns a counter that increments every time the loading state changes from false to true.
 * @param loading The loading boolean.
 * @returns A number that can be used as a dependency.
 */
export function useLoadingCounter(loading: boolean): number {
  const switchedToLoading = useIsChanged([loading], false) && loading;
  const loadCounterRef = useRef(0);

  if (switchedToLoading) {
    loadCounterRef.current += 1;
  }

  return loadCounterRef.current;
}
