import type { Enhet } from '@digdir/einnsyn-sdk';
import { CheckmarkIcon, PlusIcon, XMarkIcon } from '@navikt/aksel-icons';
import { forwardRef } from 'react';
import type { TrimmedEnhet } from '~/lib/types/enhet';
import cn from '~/lib/utils/className';
import { useAncestorsAsString, useName } from '~/lib/utils/enhetUtils';
import styles from './EnhetSelector.module.scss';

interface EnhetSelectorSelectItemProps {
  enhet: TrimmedEnhet;
  variant?: 'available' | 'selected';
  actionLabel?: string;
  isFocused?: boolean;
  onClick?: () => void;
  // isSelected denotes if this item is actually chosen, not just highlighted
  isSelected?: boolean;
}

export const EnhetSelectorSelectItem = forwardRef<
  HTMLButtonElement,
  EnhetSelectorSelectItemProps
>(
  (
    {
      enhet,
      variant = 'available',
      actionLabel,
      isFocused = false,
      onClick,
      isSelected = false,
    },
    ref,
  ) => {
    const ancestors = useAncestorsAsString(enhet as Enhet, ' / ');
    const name = useName(enhet as Enhet);
    const isSelectedColumn = variant === 'selected';
    const isAlreadyAdded = isSelected && !isSelectedColumn;
    const ActionIcon = isSelectedColumn
      ? XMarkIcon
      : isAlreadyAdded
        ? CheckmarkIcon
        : PlusIcon;
    const itemActionLabel = isSelectedColumn
      ? actionLabel
      : !isAlreadyAdded
        ? actionLabel
        : undefined;

    return (
      <button
        type="button"
        ref={ref}
        tabIndex={-1}
        aria-label={itemActionLabel ? `${itemActionLabel}: ${name}` : name}
        aria-pressed={!isSelectedColumn ? isSelected : undefined}
        data-focused={isFocused}
        disabled={isAlreadyAdded}
        onClick={onClick}
        className={cn(styles.selectorListItem, {
          [styles.focusedListItem]: isFocused,
          [styles.availableSelectedListItem]: isAlreadyAdded,
          [styles.availableListItem]: !isSelectedColumn,
          [styles.selectedColumnListItem]: isSelectedColumn,
        })}
      >
        <span className={styles.selectorListText}>
          {ancestors && <span className={styles.ancestors}>{ancestors}</span>}
          <span className={styles.selectorListName}>{name}</span>
        </span>

        <span
          className={cn(styles.selectorListAction, {
            [styles.availableListAction]: !isSelectedColumn,
            [styles.selectedColumnAction]: isSelectedColumn,
            [styles.availableListActionSelected]: isAlreadyAdded,
          })}
        >
          <ActionIcon fontSize="1.1rem" aria-hidden="true" />
          {itemActionLabel && (
            <span className={styles.selectorListActionLabel}>
              {itemActionLabel}
            </span>
          )}
        </span>
      </button>
    );
  },
);

EnhetSelectorSelectItem.displayName = 'EnhetSelectorSelectItem';
