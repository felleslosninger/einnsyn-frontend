import { startTransition, useState, type Dispatch, type SetStateAction } from 'react';

/**
 * A wrapper around useState that wraps the set-function inside startTransition
 */
export default function useTransitionState<T>(
  initialValue: T | (() => T),
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState(initialValue);

  const setTransitionState = (newState: SetStateAction<T>) => {
    startTransition(() => {
      setState(newState);
    });
  };

  return [state, setTransitionState];
}
