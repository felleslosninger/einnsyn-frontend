import { Buildings3Icon, CheckmarkIcon } from '@navikt/aksel-icons';
import { forwardRef } from 'react';
import cn from '~/lib/utils/className';
import styles from './EnhetSelector.module.scss';

interface EnhetSelectorMobileItemProps {
  id?: string;
  label: string;
  ancestors?: string;
  isSelected?: boolean;
  isFocused?: boolean;
  onClick?: () => void;
}

export const EnhetSelectorMobileItem = forwardRef<
  HTMLButtonElement,
  EnhetSelectorMobileItemProps
>(
  (
    { id, label, ancestors, isSelected = false, isFocused = false, onClick },
    ref,
  ) => (
    <button
      type="button"
      id={id}
      ref={ref}
      tabIndex={-1}
      aria-label={ancestors ? `${ancestors} / ${label}` : label}
      aria-selected={isSelected}
      data-focused={isFocused}
      onClick={onClick}
      role="option"
      className={cn(styles.mobileListItem, {
        [styles.mobileListItemSelected]: isSelected,
        [styles.focusedListItem]: isFocused,
      })}
    >
      <Buildings3Icon
        className={styles.mobileListIcon}
        fontSize="1.25rem"
        aria-hidden="true"
      />
      <span className={styles.mobileListText}>
        {ancestors && (
          <span className={styles.mobileListAncestors}>{ancestors}</span>
        )}
        <span className={styles.mobileListLabel}>{label}</span>
      </span>
      {isSelected && (
        <CheckmarkIcon
          className={styles.mobileListCheck}
          fontSize="1.25rem"
          aria-hidden="true"
        />
      )}
    </button>
  ),
);

EnhetSelectorMobileItem.displayName = 'EnhetSelectorMobileItem';
