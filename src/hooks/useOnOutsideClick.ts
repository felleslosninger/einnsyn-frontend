import type { RefObject } from 'react';
import { useEffect } from 'react';

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
    const container = containerRef.current;

    // Only react to clicks in the container '.einnsyn-body'. Browser extensions like password managers might click icons directly in the <body>, we don't want to react to those.
    const eInnsynBody =
      container?.ownerDocument?.querySelector('.einnsyn-body');

    if (enabled && container && eInnsynBody) {
      const onOutsideClick = (e: MouseEvent) => {
        const target = e.target;
        if (
          target instanceof HTMLElement &&
          eInnsynBody.contains(target) &&
          !container?.contains(target)
        ) {
          callback?.();
        }
      };
      // Don't react to current click
      setTimeout(() =>
        document.addEventListener('click', onOutsideClick, true),
      );
      return () => {
        // Make sure unbind happens after bind
        setTimeout(() =>
          document.removeEventListener('click', onOutsideClick, true),
        );
      };
    }
    return undefined;
  }, [callback, containerRef, enabled]);
}
