'use client';

import { Button } from '@digdir/designsystemet-react';
import { XMarkIcon } from '@navikt/aksel-icons';
import type { ReactNode, RefObject } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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

  // Enable close-on-drag for touch devices
  useDraggable({
    ref: contentRef,
    enabled: isMobileLayout && open,
    dragSelector: `.${styles['ein-modal-header'] ?? 'ein-modal-header'}`,
    onMove: (diff) => {
      // Reduce movement upwards
      if (diff.y < 0) {
        diff.y /= 3;
      }
      diff.x = 0;
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
        closeModal();
        return;
      }
      // Snap back: clear both inline styles so the settled-open CSS
      // transition animates `translate` back to its rest position.
      if (contentRef.current) {
        contentRef.current.style.translate = '';
        contentRef.current.style.transition = '';
      }
    },
  });

  // Close on backdrop click
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  };

  // Disable scrollwheel outside container
  useScrollwheelTrap(containerRef, open);

  const popup = (
    <EinPopup
      open={open}
      setOpen={(value) => !value && closeModal()}
      animate
      arrow={false}
      className={cn(
        className,
        styles['ein-modal-container'],
        'ein-modal-container',
      )}
      popupRef={containerRef}
    >
      <EinModalContext.Provider value={contextValue}>
        <div
          className={cn(styles['ein-modal-content'], 'ein-modal-content')}
          ref={contentRef}
        >
          {children}
        </div>
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: EinPopup listens to esc-events */}
        {/** biome-ignore lint/a11y/noStaticElementInteractions: Backdrop-click closes modal */}
        <div
          className={cn(styles['ein-modal-backdrop'], 'ein-modal-backdrop')}
          onWheel={() => false}
          onClick={handleBackdropClick}
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

  const closeHandler = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    einModal?.close();
  };

  return (
    <div
      className={cn(className, styles['ein-modal-header'], 'ein-modal-header')}
    >
      {children ?? (
        <h1 className="ds-heading" data-size="md">
          {title}
        </h1>
      )}
      <form method="get" action={basepath} onSubmit={closeHandler}>
        <Button
          icon
          type="submit"
          aria-label={t('site:closeModal')}
          data-color="neutral"
          data-variant="tertiary"
          className={styles['ein-modal-close-button']}
        >
          <XMarkIcon fontSize="1.5rem" />
        </Button>
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
      className={cn(className, styles['ein-modal-body'], 'ein-modal-body')}
      ref={bodyRef}
    >
      {children}
    </div>
  );
}

export function EinModalFooter({ children, className }: EinModalFooterProps) {
  return (
    <div
      className={cn(className, styles['ein-modal-footer'], 'ein-modal-footer')}
    >
      {children}
    </div>
  );
}
