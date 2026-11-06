'use client';

import { useSyncExternalStore } from 'react';

// Stable, so useSyncExternalStore never resubscribes.
const subscribeNever = () => () => {};

/**
 * False on the server and while React hydrates the server's HTML, true after,
 * so a component mounted later sees true from its first render. For choosing
 * what to render; outside render, `IS_BROWSER` is enough.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}
