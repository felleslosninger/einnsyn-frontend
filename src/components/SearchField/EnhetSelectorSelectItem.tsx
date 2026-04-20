import type { Enhet } from '@digdir/einnsyn-sdk';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckmarkIcon,
} from '@navikt/aksel-icons';
import { forwardRef } from 'react';
import type { TrimmedEnhet } from '~/actions/api/enhetActions';
import cn from '~/lib/utils/className';
import { useAncestorsAsString, useName } from '~/lib/utils/enhetUtils';
import styles from './EnhetSelector.module.scss';

interface EnhetSelectorSelectItemProps {
  enhet: TrimmedEnhet;
  remove?: boolean;
  isFocused?: boolean;
  onClick?: () => void;
  // isSelected denotes if this item is actually chosen, not just highlighted
  isSelected?: boolean;
}

export const EnhetSelectorSelectItem = forwardRef<
  HTMLDivElement,
  EnhetSelectorSelectItemProps
>(({ enhet, remove, isFocused = false, onClick, isSelected = false }, ref) => {
  const ancestors = useAncestorsAsString(enhet as Enhet, ' / ');
  const name = useName(enhet as Enhet);
  const ActionIcon = remove
    ? ArrowLeftIcon
    : isSelected
      ? CheckmarkIcon
      : ArrowRightIcon;

  return (
    <div
      ref={ref}
      role="option"
      tabIndex={-1}
      aria-selected={isSelected}
      data-focused={isFocused}
      onClick={onClick}
      onKeyUp={onClick}
      className={cn(styles.selectorListItem, {
        [styles.focusedListItem]: isFocused,
        [styles.selectedListItem]: isSelected,
      })}
    >
      <span className={styles.selectorListText}>
        {ancestors && <span className={styles.ancestors}>{ancestors}</span>}
        <span className={styles.selectorListName}>{name}</span>
      </span>

      <span
        className={cn(styles.addRemoveIcon, {
          [styles.removeActionIcon]: Boolean(remove),
          [styles.selectedActionIcon]: isSelected && !remove,
        })}
      >
        <ActionIcon fontSize="1.25rem" aria-hidden="true" />
      </span>
    </div>
  );
});

EnhetSelectorSelectItem.displayName = 'EnhetSelectorSelectItem';
