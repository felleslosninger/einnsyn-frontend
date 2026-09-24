'use client';

/**
 * A popup component that switches open/closed states in two steps,
 * waiting for transitionend if it is defined in css. If not, it
 * will switch immediately.
 */

import type { HTMLAttributes, ReactNode, RefObject } from 'react';
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
import { domIsHidden } from '~/lib/utils/domIsHidden';
import {
  EinTransition,
  type EinTransitionEvents,
} from '../EinTransition/EinTransition';
import styles from './EinPopup.module.scss';

export type EinPopupProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  closeOnOutsideClick?: boolean;
  closeOnEsc?: boolean;
  trapFocus?: boolean;
  children: ReactNode;
  animate?: boolean;
  transitionEvents?: EinTransitionEvents;
  className?: string;
  popupRef?: RefObject<HTMLDivElement | null>;
  anchorRef?: RefObject<Element | null>;
  sizeReferenceRef?: RefObject<Element | null>;
  preferredPosition?: PopupPosition[];
  // Skip the default visual chrome (drop-shadow, content background,
  // border-radius, arrow). Useful for callers that fully style the popup.
  unstyled?: boolean;
  // Render a pointing arrow toward the anchor. Defaults to true. Only takes
  // effect when chrome is enabled (i.e. `unstyled` is false) and the chosen
  // position is one of the cardinal sides (above/below/left/right).
  arrow?: boolean;
  // Move focus into the popup's content container when it opens. Use for
  // dialog/menu-style popups so keyboard and screen-reader users land inside;
  // leave off for tooltips and popups whose trigger should keep focus. Pair
  // with `contentProps` to give the focused container a role + accessible name.
  autoFocus?: boolean;
  // Return focus to the trigger (the anchor, or whatever was focused on open)
  // when the popup closes — unless focus has since moved to another control.
  // Off by default so existing callers are unaffected.
  restoreFocus?: boolean;
  // Spread onto the content container — e.g. `role`, `aria-label`, `id`. The
  // container is what `autoFocus` focuses, so this is where dialog/menu
  // semantics belong.
  contentProps?: HTMLAttributes<HTMLDivElement>;
};

export default function EinPopup(props: EinPopupProps) {
  const fallbackPopupRef = useRef<HTMLDivElement | null>(null);
  const {
    open = false,
    closeOnOutsideClick = true,
    closeOnEsc = true,
    trapFocus = true,
    animate = false,
    className,
    children,
    transitionEvents,
    popupRef = fallbackPopupRef,
    anchorRef: anchorRefProp,
    sizeReferenceRef,
    preferredPosition = ['below', 'above', 'right', 'left'],
    unstyled = false,
    arrow = true,
    autoFocus = false,
    restoreFocus = false,
    contentProps,
    setOpen = () => undefined,
  } = props;
  const anchorRef = useRef<Element | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  /**
   * Set the position of the popup relative to the anchor element.
   */
  const updatePopupPosition = useCallback(() => {
    const popupElement = popupRef.current;
    const anchorElement = anchorRef.current;

    if (
      !(popupElement instanceof HTMLElement) ||
      !(anchorElement instanceof HTMLElement) ||
      getComputedStyle(popupElement).position !== 'absolute'
    ) {
      return;
    }

    // To calculate the position of the popup, we need to find the current
    // dimensions of the popup element. Move it far up and left, so that it's current
    // position does not affect its size. Clear any previous width override so
    // the popup re-measures its natural size.
    const body = document.body;
    popupElement.style.top = `${-body.scrollHeight}px`;
    popupElement.style.left = `${-body.scrollWidth}px`;
    popupElement.style.width = '';
    popupElement.style.maxHeight = '';
    // Use offset{Width,Height} so an in-flight enter-transition transform
    // (e.g. scale(0.97)) doesn't shrink the measured size and place the
    // popup slightly off — getBoundingClientRect() includes the transform.
    const rectFromBoundingRect = popupElement.getBoundingClientRect();
    const popupRect = new DOMRect(
      rectFromBoundingRect.x,
      rectFromBoundingRect.y,
      popupElement.offsetWidth,
      popupElement.offsetHeight,
    );
    const anchorRect = anchorElement.getBoundingClientRect();
    const sizeReferenceElement = sizeReferenceRef?.current;
    const sizeReferenceRect =
      sizeReferenceElement instanceof HTMLElement
        ? sizeReferenceElement.getBoundingClientRect()
        : undefined;

    const position = calculatePopupPosition({
      popup: popupRect,
      anchor: anchorRect,
      sizeReference: sizeReferenceRect,
      preferredPosition,
    });
    if (!position) {
      // Could not find a relative position that fits in the viewport
      popupElement.style.top = '';
      popupElement.style.left = '';
      return;
    }

    // calculatePopupPosition returns page (document) coordinates. Convert them
    // into the popup's containing block:
    //  - With a positioned ancestor, subtract the ancestor's page-relative
    //    top/left (its viewport rect plus the window scroll).
    //  - With none (e.g. portalled to <body>), the containing block is the
    //    initial containing block, whose origin is the document origin — so the
    //    page coordinates are already correct and must NOT be scroll-adjusted.
    //    (Subtracting the scroll here is what pushed portalled popups up by
    //    exactly the scroll distance.)
    const positionedAncestor = getClosestPositionedAncestor(popupElement);
    if (positionedAncestor) {
      const ancestorRect = positionedAncestor.getBoundingClientRect();
      position.top -= ancestorRect.top + window.scrollY;
      position.left -= ancestorRect.left + window.scrollX;
    }

    // Set the final position of the popup popup
    popupElement.style.setProperty('top', `${position.top}px`);
    popupElement.style.setProperty('left', `${position.left}px`);
    if (typeof position.width === 'number') {
      popupElement.style.setProperty('width', `${position.width}px`);
    }
    if (typeof position.maxHeight === 'number') {
      popupElement.style.setProperty('max-height', `${position.maxHeight}px`);
      // Also expose as a CSS variable so children can size themselves
      // against the available space (e.g. to fill it with `height:`).
      popupElement.style.setProperty(
        '--ein-popup-max-height',
        `${position.maxHeight}px`,
      );
    }
    popupElement.style.setProperty('--ein-popup-position', position.position);
    popupElement.style.setProperty(
      '--ein-popup-arrow-top',
      position.arrowTop ? `${position.arrowTop}px` : '',
    );
    popupElement.style.setProperty(
      '--ein-popup-arrow-left',
      position.arrowLeft ? `${position.arrowLeft}px` : '',
    );
  }, [preferredPosition, popupRef, sizeReferenceRef]);

  // Update the ref of the anchor when the popup is opened
  useLayoutEffect(() => {
    if (open) {
      anchorRef.current = anchorRefProp?.current ?? document.activeElement;
      if (anchorRef.current instanceof HTMLElement) {
        anchorRef.current.classList.add('active');
      }
    } else if (!open && anchorRef.current instanceof HTMLElement) {
      const trigger = anchorRef.current;
      trigger.classList.remove('active');
      anchorRef.current = null;
      // Return focus to the trigger on close, but only if focus is still inside
      // the popup (animating out) or fell to <body> (the content unmounted) —
      // i.e. the close wasn't the user moving focus to another control.
      if (restoreFocus) {
        const active = document.activeElement;
        const focusLeftInPopup = contentRef.current?.contains(active) ?? false;
        if (active === document.body || focusLeftInPopup) {
          trigger.focus({ preventScroll: true });
        }
      }
    }
  }, [open, anchorRefProp, restoreFocus]);

  // Move focus into the content container when opening, if requested. Runs
  // after the anchor is recorded (above) so `restoreFocus` still targets the
  // trigger rather than the popup itself.
  useEffect(() => {
    if (open && autoFocus) {
      contentRef.current?.focus({ preventScroll: true });
    }
  }, [open, autoFocus]);

  // Update popup position on resize
  useEffect(() => {
    if (open) {
      // Update position on window resize
      if (!domIsHidden(popupRef.current)) {
        updatePopupPosition();
      }
      window.addEventListener('resize', updatePopupPosition);

      // Follow anchor size changes — e.g. a summary button that grows as the
      // user selects items. Without this, the popup is pinned to its initial
      // position and drifts out of alignment as the anchor resizes.
      let anchorObserver: ResizeObserver | undefined;
      if (anchorRef.current instanceof Element) {
        anchorObserver = new ResizeObserver(() => updatePopupPosition());
        anchorObserver.observe(anchorRef.current);
      }

      // Clean up the event listener on unmount or when open changes
      return () => {
        window.removeEventListener('resize', updatePopupPosition);
        anchorObserver?.disconnect();
      };
    }
  }, [open, popupRef, updatePopupPosition]);

  // Update popup position when it becomes visible
  useLayoutEffect(() => {
    const popupElement = popupRef.current;
    if (open && popupElement && domIsHidden(popupElement)) {
      popupElement.style.visibility = 'hidden';
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            popupElement.style.visibility = '';
            updatePopupPosition();
          }
        },
        { threshold: 0.01 },
      );

      observer.observe(popupElement);

      return () => {
        observer.disconnect();
      };
    }
  }, [open, popupRef, updatePopupPosition]);

  // If we're animating in, update the position after the content has loaded
  const events: EinTransitionEvents = useMemo(
    () => ({
      onInitEnterTransition: () => updatePopupPosition(),
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
  useFocusTrap(popupRef, trapFocus);

  const {
    className: contentClassName,
    tabIndex: contentTabIndex,
    ...restContentProps
  } = contentProps ?? {};

  const content = open ? (
    <div
      className={cn(
        className,
        styles.einPopup,
        { [styles.einPopupChrome]: !unstyled },
        { [styles.einPopupArrow]: !unstyled && arrow },
        { [styles.open]: open, [styles.closed]: !open },
        open ? 'open' : 'closed',
        'ein-popup',
      )}
      ref={popupRef}
    >
      <div
        {...restContentProps}
        ref={contentRef}
        // Focusable (but not tab-stop) so `autoFocus` can land here; callers can
        // override via contentProps.tabIndex.
        tabIndex={contentTabIndex ?? (autoFocus ? -1 : undefined)}
        className={cn(
          styles.einPopupContent,
          'ein-popup-content',
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  ) : null;

  // Wrap in EinTransition if we're animating
  return animate ? (
    <EinTransition
      dependencies={[open]}
      withClassNames
      events={{ ...events, ...transitionEvents }}
    >
      {content}
    </EinTransition>
  ) : (
    content
  );
}
