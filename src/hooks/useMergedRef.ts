import { type Ref, useCallback, useLayoutEffect, useRef } from 'react';

function setRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (!ref) {
    return;
  }

  if (typeof ref === 'function') {
    ref(value);
  } else {
    ref.current = value;
  }
}

/**
 * A helper hook to combine multiple refs.
 */
export function useMergedRefs<T>(...refs: (Ref<T> | undefined)[]) {
  const currentRefs = useRef(refs);
  const previousRefs = useRef(refs);
  const currentValue = useRef<T | null>(null);

  currentRefs.current = refs;

  useLayoutEffect(() => {
    const refsToClear = previousRefs.current.filter(
      (ref) => ref && !refs.includes(ref),
    );
    const refsToAssign = refs.filter(
      (ref) => ref && !previousRefs.current.includes(ref),
    );

    refsToClear.forEach((ref) => {
      setRef(ref, null);
    });
    refsToAssign.forEach((ref) => {
      setRef(ref, currentValue.current);
    });

    previousRefs.current = refs;
  });

  return useCallback((value: T | null) => {
    currentValue.current = value;
    currentRefs.current.forEach((ref) => {
      setRef(ref, value);
    });
  }, []);
}
