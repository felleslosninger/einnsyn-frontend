'use client';

import { Button } from '@digdir/designsystemet-react';
import { XMarkIcon } from '@navikt/aksel-icons';
import type { ReactNode, RefObject } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import useBreakpoint from '~/hooks/useBreakpoint';
import { useDraggable } from '~/hooks/useDraggable';
import { useModalBasepath } from '~/hooks/useModalBasepath';
import { useScrollwheelTrap } from '~/hooks/useScrollwheelTrap';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import EinPopup from '../EinPopup/EinPopup';
import type { EinTransitionEvents } from '../EinTransition/EinTransition';
import { useNavigation } from '../NavigationProvider/NavigationProvider';
import styles from './EinModal.module.scss';

type EinModalContextValue = { close: () => void };
const EinModalContext = createContext<EinModalContextValue | null>(null);

type EinModalProps = Readonly<{
  open: boolean;
  children: ReactNode;
  className?: string;
  containerRef?: RefObject<HTMLDivElement>;
  setOpen?: (open: boolean) => void;
  onClose?: () => void;
}>;

type EinModalHeaderProps = Readonly<{
  title?: string;
  className?: string;
  children?: ReactNode;
}>;

type EinModalBodyProps = Readonly<{
  children: ReactNode;
  className?: string;
  bodyRef?: RefObject<HTMLDivElement>;
}>;

type EinModalFooterProps = Readonly<{
  children: ReactNode;
  className?: string;
}>;

export default function EinModal({
  open,
  children,
  className,
  containerRef: containerRefProp,
  setOpen,
  onClose,
}: EinModalProps) {
  const navigation = useNavigation();
  const basepath = useModalBasepath();
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  // Update portal target for client-side rendering
  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  // Any close trigger (X-button, drag-to-close, escape, outside-click) runs
  // through here so callers see a single, consistent close path.
  const closeModal = useCallback(() => {
    onClose?.();
    if (setOpen) {
      setOpen(false);
    } else if (basepath !== navigation.pathname) {
      // Route-driven callers (intercepted route segments) rely on navigation
      // back to the basepath instead of a setter.
      navigation.push(basepath);
    }
  }, [onClose, setOpen, basepath, navigation]);

  const contextValue = useMemo(() => ({ close: closeModal }), [closeModal]);
  const isMobileLayout = useBreakpoint('SM');
  const backupContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = containerRefProp ?? backupContainerRef;
  const contentRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Enable close-on-drag for touch devices
  useDraggable({
    ref: contentRef,
    enabled: isMobileLayout && open,
    dragSelector: `.${styles.einModalHeader ?? 'ein-modal-header'}`,
    onMove: (diff) => {
      // Reduce movement upwards
      if (diff.y < 0) {
        diff.y /= 3;
      }
      diff.x = 0;

      // Fade the backdrop in proportion to downward drag, so the sheet feels
      // physically connected to the dim. Disable the transition so it tracks
      // the finger rather than easing into each position.
      if (backdropRef.current) {
        const height = contentRef.current?.offsetHeight ?? 1;
        const progress = diff.y > 0 ? Math.min(diff.y / height, 1) : 0;
        backdropRef.current.style.opacity = String(0.5 * (1 - progress));
        backdropRef.current.style.transition = 'none';
      }
    },
    onEnd: (diff) => {
      if (diff.y > 0) {
        // Closing: keep the inline translate so EinTransition's snapshot
        // starts at the drag position. Clear only the inline transition
        // (useDraggable set it to `all 0s`) so the CSS exit transition on
        // `transform` can fire. The two properties compose, so the snapshot
        // slides from the drag position down off-screen.
        if (contentRef.current) {
          contentRef.current.style.transition = '';
        }
        // The snapshot inherits the backdrop's inline opacity. The
        // onExitTransition hook clears it atomically with the exit class so
        // the CSS rule (opacity: 0) animates from the dragged value to 0.
        closeModal();
        return;
      }
      // Snap back: clear inline styles so the settled-open CSS transition
      // animates `translate` and `opacity` back to their rest positions.
      if (contentRef.current) {
        contentRef.current.style.translate = '';
        contentRef.current.style.transition = '';
      }
      if (backdropRef.current) {
        backdropRef.current.style.opacity = '';
        backdropRef.current.style.transition = '';
      }
    },
  });

  // Hand backdrop control back to CSS at the exact moment the exit class is
  // added. Both style changes flush together, so the transition fires from
  // the dragged inline opacity down to the CSS-defined exit opacity (0).
  const transitionEvents = useMemo<EinTransitionEvents>(
    () => ({
      onExitTransition: (popupSnapshot) => {
        const backdropSnapshot = popupSnapshot.querySelector(
          `.${styles.einModalBackdrop ?? 'ein-modal-backdrop'}`,
        );
        if (backdropSnapshot instanceof HTMLElement) {
          backdropSnapshot.style.transition = '';
          backdropSnapshot.style.opacity = '';
        }
      },
    }),
    [],
  );

  // Close on backdrop click
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  };

  // Disable scrollwheel outside container
  useScrollwheelTrap(containerRef, open);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!open || !container) {
      return;
    }

    const updateViewportBounds = () => {
      const viewport = window.visualViewport;
      const top = viewport?.offsetTop ?? 0;
      const left = viewport?.offsetLeft ?? 0;
      const width = viewport?.width ?? window.innerWidth;
      const height = viewport?.height ?? window.innerHeight;

      container.style.setProperty('--ein-modal-viewport-top', `${top}px`);
      container.style.setProperty('--ein-modal-viewport-left', `${left}px`);
      container.style.setProperty('--ein-modal-viewport-width', `${width}px`);
      container.style.setProperty('--ein-modal-viewport-height', `${height}px`);
      container.style.setProperty(
        '--ein-modal-sheet-max-height',
        `${height * 0.95}px`,
      );
    };

    updateViewportBounds();
    window.visualViewport?.addEventListener('resize', updateViewportBounds);
    window.visualViewport?.addEventListener('scroll', updateViewportBounds);
    window.addEventListener('resize', updateViewportBounds);

    return () => {
      window.visualViewport?.removeEventListener(
        'resize',
        updateViewportBounds,
      );
      window.visualViewport?.removeEventListener(
        'scroll',
        updateViewportBounds,
      );
      window.removeEventListener('resize', updateViewportBounds);
      container.style.removeProperty('--ein-modal-viewport-top');
      container.style.removeProperty('--ein-modal-viewport-left');
      container.style.removeProperty('--ein-modal-viewport-width');
      container.style.removeProperty('--ein-modal-viewport-height');
      container.style.removeProperty('--ein-modal-sheet-max-height');
    };
  }, [open, containerRef]);

  const popup = (
    <EinPopup
      open={open}
      setOpen={(value) => !value && closeModal()}
      animate
      unstyled
      arrow={false}
      className={cn(className, styles.einModalContainer, 'ein-modal-container')}
      popupRef={containerRef}
      transitionEvents={transitionEvents}
    >
      <EinModalContext.Provider value={contextValue}>
        <div
          className={cn(styles.einModalContent, 'ein-modal-content')}
          ref={contentRef}
        >
          {children}
        </div>
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: EinPopup listens to esc-events */}
        {/** biome-ignore lint/a11y/noStaticElementInteractions: Backdrop-click closes modal */}
        <div
          className={cn(styles.einModalBackdrop, 'ein-modal-backdrop')}
          onWheel={() => false}
          onClick={handleBackdropClick}
          ref={backdropRef}
        />
      </EinModalContext.Provider>
    </EinPopup>
  );

  if (portalTarget) {
    return createPortal(popup, portalTarget);
  }
  return null;
}

export function EinModalHeader({
  title,
  className,
  children,
}: EinModalHeaderProps) {
  const t = useTranslation();
  const basepath = useModalBasepath();
  const einModal = useContext(EinModalContext);
  const isMobileLayout = useBreakpoint('SM');

  const closeHandler = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    einModal?.close();
  };

  return (
    <div className={cn(className, styles.einModalHeader, 'ein-modal-header')}>
      {children ?? (
        <h1 className="ds-heading" data-size="md">
          {title}
        </h1>
      )}
      <form method="get" action={basepath} onSubmit={closeHandler}>
        {isMobileLayout ? (
          <Button
            type="submit"
            data-color="accent"
            data-variant="tertiary"
            className={cn(
              styles.einModalCloseButton,
              styles.einModalDoneButton,
              'ein-modal-close-button',
            )}
          >
            {t('site.done')}
          </Button>
        ) : (
          <Button
            icon
            type="submit"
            aria-label={t('site.closeModal')}
            data-color="neutral"
            data-variant="tertiary"
            className={cn(styles.einModalCloseButton, 'ein-modal-close-button')}
          >
            <XMarkIcon fontSize="1.5rem" />
          </Button>
        )}
      </form>
    </div>
  );
}

export function EinModalBody({
  children,
  className,
  bodyRef,
}: EinModalBodyProps) {
  return (
    <div
      className={cn(className, styles.einModalBody, 'ein-modal-body')}
      ref={bodyRef}
    >
      {children}
    </div>
  );
}

export function EinModalFooter({ children, className }: EinModalFooterProps) {
  return (
    <div className={cn(className, styles.einModalFooter, 'ein-modal-footer')}>
      {children}
    </div>
  );
}
