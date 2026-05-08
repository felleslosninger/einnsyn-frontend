'use client';

import { Button } from '@digdir/designsystemet-react';
import { XMarkIcon } from '@navikt/aksel-icons';
import type { ReactNode, RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
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
  onClose?: () => void;
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
}: EinModalProps) {
  const navigation = useNavigation();
  const basepath = useModalBasepath();
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  // Update portal target for client-side rendering
  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  // State-driven callers pass setOpen; route-driven callers (intercepted
  // route segments) rely on navigation back to the basepath instead.
  const closeModal = () => {
    if (setOpen) {
      setOpen(false);
    } else {
      navigation.push(basepath);
    }
  };
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
      // Close if dragged down
      if (diff.y > 0) {
        closeModal();
      }
      // Reset after EinPopup has updated classes
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.style.transform = '';
          contentRef.current.style.transition = '';
        }
      });
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
      className={cn(
        className,
        styles['ein-modal-container'],
        'ein-modal-container',
      )}
      popupRef={containerRef}
    >
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
  onClose,
}: EinModalHeaderProps) {
  const t = useTranslation();
  const basepath = useModalBasepath();
  const navigation = useNavigation();

  const closeHandler = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    onClose?.();
    if (basepath !== navigation.pathname) {
      navigation.push(basepath);
    }
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
