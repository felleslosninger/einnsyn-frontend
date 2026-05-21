import { PlusIcon, XMarkIcon } from '@navikt/aksel-icons';
import { forwardRef } from 'react';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { useName } from '~/lib/utils/enhetUtils';
import type { TrimmedEnhet } from '~/lib/utils/trimmedEnhetUtils';
import styles from './EnhetSelector.module.scss';

interface EnhetSelectorSelectItemProps {
  id?: string;
  enhet: TrimmedEnhet;
  // Pre-resolved second line (ancestors when present, else "Type · org.nr …").
  // Computed by the parent to avoid duplicating the fallback logic per row.
  subtitle?: string;
  variant?: 'available' | 'selected';
  isFocused?: boolean;
  onClick?: () => void;
}

export const EnhetSelectorSelectItem = forwardRef<
  HTMLButtonElement,
  EnhetSelectorSelectItemProps
>(
  (
    { id, enhet, subtitle, variant = 'available', isFocused = false, onClick },
    ref,
  ) => {
    const t = useTranslation();
    const name = useName(enhet);
    const isSelectedColumn = variant === 'selected';
    const ActionIcon = isSelectedColumn ? XMarkIcon : PlusIcon;
    const actionLabel = isSelectedColumn ? t('common.remove') : t('common.add');

    return (
      <button
        type="button"
        id={id}
        ref={ref}
        tabIndex={-1}
        aria-label={`${actionLabel}: ${name}`}
        data-focused={isFocused}
        onClick={onClick}
        role="option"
        aria-selected={isSelectedColumn || undefined}
        className={cn(styles.selectorListItem, {
          [styles.focusedListItem]: isFocused,
        })}
      >
        <span className={styles.selectorListText}>
          <span className={styles.selectorListName}>{name}</span>
          {subtitle && (
            <span className={styles.selectorListSubtitle}>{subtitle}</span>
          )}
        </span>
        <span className={styles.selectorListAction}>
          <ActionIcon fontSize="1rem" aria-hidden="true" />
          <span className={styles.selectorListActionLabel}>{actionLabel}</span>
        </span>
      </button>
    );
  },
);

EnhetSelectorSelectItem.displayName = 'EnhetSelectorSelectItem';
