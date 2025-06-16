'use client';

/**
 * A popup component that switches open/closed states in two steps,
 * waiting for transitionend if it is defined in css. If not, it
 * will switch immediately.
 */

import type { ReactNode, RefObject } from 'react';
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useFocusTrap } from '~/hooks/useFocusTrap';
import useIsChanged from '~/hooks/useIsChanged';
import useIsMounted from '~/hooks/useIsMounted';
import { useOnOutsideClick } from '~/hooks/useOnOutsideClick';
import cn from '~/lib/utils/className';
import type { EinTransitionEvents } from '../EinTransition/EinGammalTransition';
import './EinPopup.scss';
import { getClosestPositionedAncestor } from '~/lib/utils/domClosestPositionedAncestor';
import {
  calculatePopupPosition,
  type PopupPosition,
} from '~/lib/utils/calculatePopupPosition';

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
    preferredPosition = ['below', 'above', 'right', 'left'],
    setOpen = () => undefined,
  } = props;
  const isBrowser = typeof document !== 'undefined';
  const triggerRef = useRef<Element | null>(null);
  const isMounted = useIsMounted();

  // Update the ref of the trigger when the popup is opened
  useLayoutEffect(() => {
    if (isBrowser && open) {
      triggerRef.current = document.activeElement;
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.classList.add('active');
      }
    } else if (
      isBrowser &&
      !open &&
      triggerRef.current instanceof HTMLElement
    ) {
      triggerRef.current.classList.remove('active');
      triggerRef.current = null;
    }
  }, [isBrowser, open]);

  // Update trigger button position
  useLayoutEffect(() => {
    const popupElement = popupRef.current;
    const triggerElement = triggerRef.current;
    if (
      isBrowser &&
      open &&
      popupElement instanceof HTMLElement &&
      triggerElement instanceof HTMLElement &&
      getComputedStyle(popupElement).position === 'absolute'
    ) {
      updatePopupPosition(popupElement, triggerElement);

      // Update position on window resize
      const eventListener = () => {
        updatePopupPosition(popupElement, triggerElement);
      };
      window.addEventListener('resize', eventListener);

      // Clean up the event listener on unmount or when open changes
      return () => {
        window.removeEventListener('resize', eventListener);
      };
    }
  }, [open, popupRef, isBrowser]);

  // Close on esc
  useEffect(() => {
    const popup = popupRef.current;
    if (open && popup && closeOnEsc) {
      const closeEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
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

  /**
   * Set the position of the popup relative to the trigger element.
   *
   * @param popupElement
   * @param triggerElement
   * @returns
   */
  const updatePopupPosition = (
    popupElement: HTMLElement,
    triggerElement: HTMLElement,
  ) => {
    // Before we calculate the position of the popup, we need to find the current
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
  };

  return (
    //<EinTransition dependencies={[open]} events={events}>
    <>
      {open && (
        <div
          className={cn(className, { open: open, closed: !open }, 'ein-popup')}
          ref={popupRef}
        >
          <div className="ein-popup-content">{children}</div>
        </div>
      )}
    </>
    //</EinTransition>
  );
}
