import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';

/**
 *
 * @param containerRef Container
 * @param callback Function to be called on outside click
 */
export function useOnOutsideClick(
  containerRef: RefObject<HTMLElement | null>,
  callback: () => void,
): void;

/**
 *
 * @param containerRef Container
 * @param enabled Whether to enable the outside click handler
 * @param callback Function to be called on outside click
 */
export function useOnOutsideClick(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  callback: () => void,
): void;

export function useOnOutsideClick(
  containerRef: RefObject<HTMLElement | null>,
  ...args: unknown[]
): void {
  let i = 0;
  const enabled = typeof args[i] === 'boolean' ? args[i++] : true;
  const callback =
    typeof args[i] === 'function' ? (args[i++] as () => void) : undefined;

  useEffect(() => {
    // Only react to clicks in the container '.einnsyn-body'. Browser extensions like password managers might click icons directly in the <body>, we don't want to react to those.
    const eInnsynBody = document.querySelector('.einnsyn-body');
    if (!enabled || !eInnsynBody) {
      return;
    }

    const onOutsideClick = (e: MouseEvent) => {
      const target = e.target;
      if (
        target instanceof Node &&
        eInnsynBody.contains(target) &&
        !containerRef.current?.contains(target)
      ) {
        callback?.();
      }
    };

    // Don't react to current click
    const timeoutId = requestAnimationFrame(() => {
      document.addEventListener('click', onOutsideClick);
    });

    return () => {
      cancelAnimationFrame(timeoutId);
      document.removeEventListener('click', onOutsideClick);
    };
  }, [callback, containerRef, enabled]);
}
