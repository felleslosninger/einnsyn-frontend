'use client';

import { ChevronDownIcon, ChevronRightIcon } from '@navikt/aksel-icons';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { EinButton } from '~/components/EinButton/EinButton';
import EinPopup from '~/components/EinPopup/EinPopup';
import type { PopupPosition } from '~/lib/utils/calculatePopupPosition';
import cn from '~/lib/utils/className';
import { isStandardClick } from '~/lib/utils/isStandardClick';
import styles from './EinDropdown.module.scss';

export type EinDropdownProps = {
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
  triggerClassName?: string;
  popupClassName?: string;
  variant?: 'primary' | 'secondary' | 'tertiary';
  disabled?: boolean;
  closeOnItemClick?: boolean;
  showChevron?: boolean;
  showChevronRight?: boolean;
  showChevronDown?: boolean;
  preferredPosition?: PopupPosition[];
};

export default function EinDropdown({
  trigger,
  children,
  className,
  triggerClassName,
  popupClassName,
  variant = 'tertiary',
  disabled = false,
  closeOnItemClick = true,
  showChevron = false,
  showChevronRight = false,
  showChevronDown = !showChevronRight && showChevron,
  preferredPosition,
}: EinDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggle = useCallback(
    (e: React.MouseEvent<Element>) => {
      if (!isStandardClick(e)) {
        return;
      }

      if (!disabled) {
        setIsOpen(!isOpen);
      }
    },
    [disabled, isOpen],
  );

  // Use useEffect to add event listener for automatic closing on item clicks
  useEffect(() => {
    if (!isOpen || !closeOnItemClick) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const content = contentRef.current;

      // Check if the click is inside this specific dropdown
      if (!content || !content.contains(target)) return;

      // Check if clicked element should close the dropdown
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a') ||
        target.hasAttribute('data-close-dropdown') ||
        target.closest('[data-close-dropdown]')
      ) {
        setIsOpen(false);
      }
    };

    // Add event listener to document during capture phase
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [isOpen, closeOnItemClick]);

  return (
    <div
      role="toolbar"
      ref={containerRef}
      className={cn(styles.einDropdown, className, 'ein-dropdown')}
    >
      <EinButton
        ref={buttonRef}
        variant={variant}
        style="custom"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          styles.triggerButton,
          { [styles.open]: isOpen },
          triggerClassName,
          'ein-dropdown-trigger',
        )}
      >
        <span className={styles.triggerContent}>{trigger}</span>
        {showChevronDown && (
          <ChevronDownIcon
            className={cn(styles.chevron, { [styles.rotated]: isOpen })}
          />
        )}
        {showChevronRight && (
          <ChevronRightIcon
            className={cn(styles.chevron, styles.chevronRight, {
              [styles.rotated]: isOpen,
            })}
          />
        )}
      </EinButton>

      <EinPopup
        open={isOpen}
        setOpen={setIsOpen}
        className={cn(styles.dropdownPopup, popupClassName)}
        closeOnOutsideClick={true}
        closeOnEsc={true}
        preferredPosition={preferredPosition}
        triggerRef={buttonRef}
      >
        <div ref={contentRef} className={styles.dropdownContent}>
          {/* <div className={cn(styles.dropdownHeader)}>{trigger}</div> */}
          {children}
        </div>
      </EinPopup>
    </div>
  );
}
