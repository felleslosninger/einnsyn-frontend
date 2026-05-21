import { Buildings3Icon } from '@navikt/aksel-icons';
import { forwardRef } from 'react';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import styles from './EnhetSelector.module.scss';

type EnhetSummaryProps = {
  active: boolean;
  selectedSummary: string;
  summaryLabel: string;
  additionalSelectedCount: number;
  onClick: () => void;
  onFocus: (event: React.FocusEvent<HTMLButtonElement>) => void;
  onMouseDown: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

export const EnhetSummaryDesktop = forwardRef<
  HTMLButtonElement,
  EnhetSummaryProps
>(
  (
    {
      active,
      selectedSummary,
      summaryLabel,
      additionalSelectedCount,
      onClick,
      onFocus,
      onMouseDown,
    },
    ref,
  ) => {
    const t = useTranslation();
    return (
      <button
        ref={ref}
        type="button"
        className={cn(styles.summaryButton, {
          [styles.summaryButtonActive]: active,
        })}
        aria-label={selectedSummary || t('search.enhetPlaceholder')}
        aria-expanded={active}
        aria-haspopup="listbox"
        onClick={onClick}
        onFocus={onFocus}
        onMouseDown={onMouseDown}
      >
        <span className={cn(styles.summaryIcon)}>
          <Buildings3Icon
            className={cn(styles.searchIcon)}
            fontSize="1.2rem"
            aria-hidden="true"
          />
        </span>
        <span
          className={cn(styles.summaryText, {
            [styles.placeholderText]: selectedSummary.length === 0,
          })}
        >
          {summaryLabel}
        </span>

        {additionalSelectedCount > 0 && (
          <span className={styles.summaryMore} aria-hidden="true">
            +{additionalSelectedCount}
          </span>
        )}
      </button>
    );
  },
);
EnhetSummaryDesktop.displayName = 'EnhetSummaryDesktop';

export const EnhetSummaryMobile = forwardRef<
  HTMLButtonElement,
  EnhetSummaryProps
>(
  (
    {
      active,
      selectedSummary,
      summaryLabel,
      additionalSelectedCount,
      onClick,
      onFocus,
      onMouseDown,
    },
    ref,
  ) => {
    const t = useTranslation();
    return (
      <button
        ref={ref}
        type="button"
        className={cn(styles.mobileSummaryButton, {
          [styles.summaryButtonActive]: active,
        })}
        aria-label={selectedSummary || t('search.enhetPlaceholder')}
        aria-expanded={active}
        aria-haspopup="listbox"
        onClick={onClick}
        onFocus={onFocus}
        onMouseDown={onMouseDown}
      >
        <span className={cn(styles.mobileSummaryText)}>
          <span className={cn(styles.mobileSummaryPrefix)}>
            {t('search.searchingIn')}
          </span>{' '}
          <span
            className={cn(styles.mobileSummaryLabel, {
              [styles.mobileSummaryLabelPlaceholder]:
                selectedSummary.length === 0,
            })}
          >
            {summaryLabel}
          </span>
        </span>
        {additionalSelectedCount > 0 && (
          <span className={styles.mobileSummaryMore} aria-hidden="true">
            +{additionalSelectedCount}
          </span>
        )}
        <span className={styles.mobileSummaryChange} aria-hidden="true">
          {t('common.change')}
        </span>
      </button>
    );
  },
);
EnhetSummaryMobile.displayName = 'EnhetSummaryMobile';
