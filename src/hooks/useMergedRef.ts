import { type Ref, useEffect, useRef } from 'react';

/**
 * A helper hook to combine multiple refs.
 */
export function useMergedRefs<T>(...refs: (Ref<T> | undefined)[]) {
  const targetRef = useRef<T>(null);
  useEffect(() => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === 'function') {
        ref(targetRef.current);
      } else {
        (ref as React.RefObject<T | null>).current = targetRef.current;
      }
    });
  }, [refs]);
  return targetRef;
}
