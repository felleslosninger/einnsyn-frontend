import { type Ref, useCallback } from 'react';

/**
 * A helper hook to combine multiple refs.
 */
export function useMergedRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return useCallback(
    (value: T | null) => {
      refs.forEach((ref) => {
        if (!ref) {
          return;
        }
        if (typeof ref === 'function') {
          ref(value);
        } else {
          ref.current = value;
        }
      });
    },
    // biome-ignore lint/correctness/useExhaustiveDependencies: use refs as dependency array
    refs,
  );
}
