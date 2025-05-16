import type { RefObject } from 'react';
import { useEffect } from 'react';

/**
 *
 * @param containerRef Container where the focus should be trapped
 * @param enabled Whether to enable the focus trap
 * @param onExit Function to call when the focus trap is exited
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  enabled?: boolean,
  onExit?: () => void,
): void;

/**
 *
 * @param containerRef Container where the focus should be trapped
 * @param onExit Function to call when the focus trap is exited
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  onExit?: () => void,
): void;

export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  ...args: unknown[]
): void {
  let i = 0;
  const enabled = typeof args[i] === 'boolean' ? args[i++] : true;
  const onExit =
    typeof args[i] === 'function' ? (args[i] as () => void) : undefined;

  useEffect(() => {
    const container = containerRef.current;
    if (enabled && container) {
      let tabbed = false;
      const initialFocus = document.activeElement as HTMLElement;

      // Select focusable elements, sort by tab order
      const selectableElements = Array.from(
        container.querySelectorAll<HTMLElement>(selectableElementsSelector),
      )
        .map((el, index) => ({ el, index }))
        .sort((a, b) => {
          const aTabIndex = Number.parseInt(
            a.el.getAttribute('tabindex') || '0',
            10,
          );
          const bTabIndex = Number.parseInt(
            b.el.getAttribute('tabindex') || '0',
            10,
          );
          return aTabIndex - bTabIndex || a.index - b.index;
        })
        .map((wrapper) => wrapper.el);

      const firstElement = selectableElements[0];
      const lastElement = selectableElements[selectableElements.length - 1];

      const keydown = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (selectableElements.length === 0) {
            return;
          }

          // If the user has selected a field inside the popup, count this as having "tabbed"
          if (!tabbed && container.contains(document.activeElement) && document.activeElement !== initialFocus) {
            tabbed = true;
          }

          if (!tabbed && !e.shiftKey) {
            if (firstElement) {
              firstElement.focus();
              tabbed = true;
              e.preventDefault();
            }
          } else if (
            (!tabbed && e.shiftKey) ||
            (e.shiftKey && firstElement === document.activeElement) ||
            (!e.shiftKey && lastElement === document.activeElement)
          ) {
            onExit?.();
            initialFocus.focus();
            e.preventDefault();
          }
        }
      };

      document.addEventListener('keydown', keydown);
      return () => {
        document.removeEventListener('keydown', keydown);
      };
    }
    return undefined;
  }, [containerRef, onExit, enabled]);
}

const selectableElementsSelector = [
  'a[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
]
  .map((selector) => `${selector}:not([disabled]):not([tabindex^="-"])`)
  .join(', ');
