'use client';

/**
 * A popup component that switches open/closed states in two steps,
 * waiting for transitionend if it is defined in css. If not, it
 * will switch immediately.
 */

import type { ReactNode, RefObject } from 'react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import { useFocusTrap } from '~/hooks/useFocusTrap';
import { useOnOutsideClick } from '~/hooks/useOnOutsideClick';
import {
  calculatePopupPosition,
  type PopupPosition,
} from '~/lib/utils/calculatePopupPosition';
import cn from '~/lib/utils/className';
import { getClosestPositionedAncestor } from '~/lib/utils/domClosestPositionedAncestor';
import type { EinTransitionEvents } from '../EinTransition/EinTransition';
import { EinTransition } from '../EinTransition/EinTransition';
import styles from './EinPopup.module.scss';

export type EinPopupProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  closeOnOutsideClick?: boolean;
  closeOnEsc?: boolean;
  trapFocus?: boolean;
  children: ReactNode;
  transitionEvents?: EinTransitionEvents;
  transitionFromTrigger?: boolean;
  className?: string;
  popupRef?: RefObject<HTMLDivElement | null>;
  triggerRef?: RefObject<Element | null>;
  preferredPosition?: PopupPosition[];
};

export default function EinPopup(props: EinPopupProps) {
  const fallbackPopupRef = useRef<HTMLDivElement | null>(null);
  const {
    open = false,
    closeOnOutsideClick = true,
    closeOnEsc = true,
    trapFocus = true,
    transitionFromTrigger = false,
    className,
    children,
    transitionEvents,
    popupRef = fallbackPopupRef,
    triggerRef: triggerRefProp,
    preferredPosition = ['below', 'above', 'right', 'left'],
    setOpen = () => undefined,
  } = props;
  const triggerRef = useRef<Element | null>(null);

  /**
   * Set the position of the popup relative to the trigger element.
   *
   * @param popupElement
   * @param triggerElement
   * @returns
   */
  const updatePopupPosition = useCallback(() => {
    const popupElement = popupRef.current;
    const triggerElement = triggerRef.current;

    if (
      !(popupElement instanceof HTMLElement) ||
      !(triggerElement instanceof HTMLElement) ||
      getComputedStyle(popupElement).position !== 'absolute'
    ) {
      return;
    }

    // To we calculate the position of the popup, we need to find the current
    // dimensions of the popup element. Move it far up and left, so that it's current
    // position does not affect its size.
    const body = document.body;
    popupElement.style.top = `${-body.scrollHeight}px`;
    popupElement.style.left = `${-body.scrollWidth}px`;
    const popupRect = popupElement.getBoundingClientRect();
    const triggerRect = triggerElement.getBoundingClientRect();

    const position = calculatePopupPosition({
      popup: popupRect,
      reference: triggerRect,
      preferredPosition,
    });
    if (!position) {
      // Could not find a relative position that fits in the viewport
      popupElement.style.top = '';
      popupElement.style.left = '';
      return;
    }

    // Get the closest positioned ancestor of the popup, since we need to subtract
    // its position from the popup position to get the correct absolute position.
    const positionedAncestor = getClosestPositionedAncestor(popupElement);
    if (positionedAncestor) {
      const ancestorRect = positionedAncestor.getBoundingClientRect();
      position.top -= ancestorRect.top;
      position.left -= ancestorRect.left;
    }

    // Add scroll offsets to the position
    position.top -= window.scrollY;
    position.left -= window.scrollX;

    // Set the final position of the popup popup
    popupElement.style.setProperty('top', `${position.top}px`);
    popupElement.style.setProperty('left', `${position.left}px`);
    popupElement.style.setProperty('--ein-popup-position', position.position);
    popupElement.style.setProperty(
      '--ein-popup-arrow-top',
      position.arrowTop ? `${position.arrowTop}px` : '',
    );
    popupElement.style.setProperty(
      '--ein-popup-arrow-left',
      position.arrowLeft ? `${position.arrowLeft}px` : '',
    );
  }, [preferredPosition, popupRef]);

  // Update the ref of the trigger when the popup is opened
  useLayoutEffect(() => {
    if (open) {
      triggerRef.current = triggerRefProp?.current ?? document.activeElement;
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.classList.add('active');
      }
    } else if (!open && triggerRef.current instanceof HTMLElement) {
      triggerRef.current.classList.remove('active');
      triggerRef.current = null;
    }
  }, [open, triggerRefProp?.current]);

  // Update popup position on resize
  useLayoutEffect(() => {
    if (open) {
      // Update position on window resize
      updatePopupPosition();
      window.addEventListener('resize', updatePopupPosition);

      // Clean up the event listener on unmount or when open changes
      return () => {
        window.removeEventListener('resize', updatePopupPosition);
      };
    }
  }, [open, updatePopupPosition]);

  const events: EinTransitionEvents = useMemo(
    () => ({
      onInitTransitionIn: () => updatePopupPosition(),
    }),
    [updatePopupPosition],
  );

  // Close on esc
  useEffect(() => {
    const popup = popupRef.current;
    if (open && popup && closeOnEsc) {
      const closeEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          const activeElement = document.activeElement;
          // Don't close if an input field has focus
          if (
            activeElement instanceof HTMLInputElement ||
            activeElement instanceof HTMLTextAreaElement
          ) {
            activeElement.blur();
            return;
          }
          // Close the innermost popup, don't close all when nested
          if (popup.querySelectorAll(`.${styles.einPopup}`).length > 0) {
            return;
          }
          setOpen(false);
        }
      };
      document.addEventListener('keyup', closeEsc);
      return () => {
        document.removeEventListener('keyup', closeEsc);
      };
    }
    return undefined;
  }, [closeOnEsc, popupRef, open, setOpen]);

  // Close on click outside
  const outsideClickHandler = useCallback(() => {
    setOpen(false);
  }, [setOpen]);
  useOnOutsideClick(popupRef, open && closeOnOutsideClick, outsideClickHandler);

  // Trap focus when open
  useFocusTrap(popupRef, trapFocus); //, () => setOpen(false));

  return (
    //<EinTransition dependencies={[open]} withClassNames events={events}>
    <>
      {open && (
        <div
          className={cn(
            className,
            styles.einPopup,
            { [styles.open]: open, [styles.closed]: !open },
            'ein-popup',
          )}
          ref={popupRef}
        >
          <div className={cn(styles.einPopupContent, 'ein-popup-content')}>
            {children}
          </div>
        </div>
      )}
    </>
    //</EinTransition>
  );
}
