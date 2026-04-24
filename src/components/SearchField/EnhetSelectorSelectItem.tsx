import { CheckmarkIcon, PlusIcon, XMarkIcon } from '@navikt/aksel-icons';
import { forwardRef, type MouseEvent } from 'react';
import cn from '~/lib/utils/className';
import { useAncestorsAsString, useName } from '~/lib/utils/enhetUtils';
import type { TrimmedEnhet } from '~/lib/utils/trimmedEnhetUtils';
import styles from './EnhetSelector.module.scss';

interface EnhetSelectorSelectItemProps {
  id?: string;
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
      id,
      enhet,
      variant = 'available',
      actionLabel,
      isFocused = false,
      onClick,
      isSelected = false,
    },
    ref,
  ) => {
    const ancestors = useAncestorsAsString(enhet, ' / ');
    const name = useName(enhet);
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
    const onMouseDown = isAlreadyAdded
      ? (event: MouseEvent<HTMLButtonElement>) => {
          event.preventDefault();
        }
      : undefined;

    return (
      <button
        type="button"
        id={id}
        ref={ref}
        tabIndex={-1}
        aria-label={itemActionLabel ? `${itemActionLabel}: ${name}` : name}
        aria-pressed={!isSelectedColumn ? isSelected : undefined}
        data-focused={isFocused}
        onMouseDown={onMouseDown}
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
