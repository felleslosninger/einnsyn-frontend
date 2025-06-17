'use client';

import { Button } from '@digdir/designsystemet-react';
import { XMarkIcon } from '@navikt/aksel-icons';
import { useRouter } from 'next/navigation';
import type { ReactNode, RefObject } from 'react';
import { useRef } from 'react';
import { useModalBasepath } from '~/app/@modal/ModalWrapper';
import useBreakpoint from '~/hooks/useBreakpoint';
import { useDraggable } from '~/hooks/useDraggable';
import { useScrollwheelTrap } from '~/hooks/useScrollwheelTrap';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import EinPopup from '../EinPopup/EinPopup';
import styles from './EinModal.module.scss';

type EinModalProps = {
  open: boolean;
  children: ReactNode;
  className?: string;
  containerRef?: RefObject<HTMLDivElement>;
  setOpen?: (open: boolean) => void;
};

type EinModalHeaderProps = {
  title?: string;
  className?: string;
  children?: ReactNode;
};

type EinModalBodyProps = {
  children: ReactNode;
  className?: string;
  bodyRef?: RefObject<HTMLDivElement>;
};

type EinModalFooterProps = {
  children: ReactNode;
  className?: string;
  bodyRef?: RefObject<HTMLDivElement>;
};

export default function EinModal({
  open,
  children,
  className,
  containerRef: containerRefProp,
  setOpen,
}: EinModalProps) {
  const router = useRouter();
  const basepath = useModalBasepath();
  const closeModal = () => {
    setOpen?.(false);
    router.push(basepath);
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

  // Disable scrollwheel outside container
  useScrollwheelTrap(containerRef, open);

  return (
    <EinPopup
      open={open}
      setOpen={(value) => !value && closeModal()}
      className={cn(
        className,
        styles['ein-modal-container'],
        'ein-modal-container',
      )}
      popupRef={containerRef}
      transitionFromTrigger
    >
      <div
        className={cn(styles['ein-modal-content'], 'ein-modal-content')}
        ref={contentRef}
      >
        {children}
      </div>
      <div
        className={cn(styles['ein-modal-backdrop'], 'ein-modal-backdrop')}
        onWheel={() => false}
      />
    </EinPopup>
  );
}

export function EinModalHeader({
  title,
  className,
  children,
}: EinModalHeaderProps) {
  const t = useTranslation();
  const basepath = useModalBasepath();
  const router = useRouter();

  const closeHandler = (event: React.MouseEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(basepath);
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
