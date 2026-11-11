'use client';

import { Fieldset, Radio } from '@digdir/designsystemet-react';
import { useId, useState } from 'react';
import { EinDropdown } from '~/components/EinDropdown';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import styles from './DateFilter.module.scss';

const DATE_PRESETS = {
  all: 'common.all',
  '-24h': 'searchFilters.datePresets.pastDay',
  '-7d': 'searchFilters.datePresets.pastWeek',
  '-1m': 'searchFilters.datePresets.pastMonth',
  '-1y': 'searchFilters.datePresets.pastYear',
  custom: 'searchFilters.datePresets.customRange',
};

const parseTimestamp = (timestamp: string | undefined) => {
  if (!timestamp) {
    return undefined;
  }
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? undefined
    : date.toISOString().split('T')[0];
};

const parseCurrentValue = (
  value: string | undefined,
  defaultValue: string,
): [string, string?, string?] => {
  if (value === undefined) {
    return [defaultValue];
  }

  if (Object.keys(DATE_PRESETS).includes(value)) {
    return [value];
  }

  // Parse
  const timestamps = value.split('/');
  return [
    'custom',
    parseTimestamp(timestamps[0]),
    parseTimestamp(timestamps[1]),
  ];
};

/**
 * A dropdown filter for selecting a date or date range.
 * Supports presets (e.g., "Last 7 days") and a custom date range.
 * Controlled by the filter's token in the search query.
 */
export function DateFilter({
  className,
  label,
  defaultValue = 'all',
  value,
  setValue,
}: {
  className?: string;
  label: string;
  defaultValue?: string;
  value?: string;
  setValue?: (value: string | undefined) => void;
}) {
  const t = useTranslation();
  const name = useId();
  const [radioValue] = parseCurrentValue(value, defaultValue);

  // The last custom range, kept while a preset is selected so "custom" can
  // restore it. Follows the query whenever the query holds a range.
  const [customValue, setCustomValue] = useState(
    radioValue === 'custom' ? (value ?? '') : '',
  );
  if (radioValue === 'custom' && value !== customValue) {
    setCustomValue(value ?? '');
  }
  const [, customFromValue = '', customToValue = ''] = parseCurrentValue(
    customValue,
    defaultValue,
  );

  const update = (next: string) =>
    setValue?.(next === defaultValue ? undefined : next);

  // "Custom" without a range is the empty token (`publisert:`), which the
  // query keeps apart from "all".
  const selectOption = (option: string) => {
    if (option !== radioValue) {
      update(option === 'custom' ? customValue : option);
    }
  };

  const getOptionProps = (option: string) => ({
    name,
    value: option,
    checked: radioValue === option,
    onChange: () => selectOption(option),
  });

  const setCustomRange = (from: string, to: string) =>
    update(from || to ? `${from}/${to}` : '');

  return (
    <EinDropdown
      trigger={label}
      showChevronRight
      className={cn(styles.dateFilter, className, 'dropdown-option')}
      preferredPosition={[
        'rightTop',
        'leftTop',
        'belowRight',
        'belowLeft',
        'right',
        'left',
        'below',
        'above',
      ]}
    >
      <Fieldset className={styles.radioGroup}>
        <Radio
          label={t('common.all')}
          className={cn(styles.radioOption, { active: radioValue === 'all' })}
          {...getOptionProps('all')}
        />
        <div className={cn('spacer')} />
        <Radio
          label={t('searchFilters.datePresets.pastDay')}
          className={cn(styles.radioOption, {
            active: radioValue === '-24h',
          })}
          {...getOptionProps('-24h')}
        />
        <Radio
          label={t('searchFilters.datePresets.pastWeek')}
          className={cn(styles.radioOption, {
            active: radioValue === '-7d',
          })}
          {...getOptionProps('-7d')}
        />
        <Radio
          label={t('searchFilters.datePresets.pastMonth')}
          className={cn(styles.radioOption, {
            active: radioValue === '-1m',
          })}
          {...getOptionProps('-1m')}
        />
        <Radio
          label={t('searchFilters.datePresets.pastYear')}
          className={cn(styles.radioOption, {
            active: radioValue === '-1y',
          })}
          {...getOptionProps('-1y')}
        />
        <div className={cn('spacer')} />
        <Radio
          label={t('searchFilters.datePresets.customRange')}
          className={cn(styles.radioOption, {
            active: radioValue === 'custom',
          })}
          {...getOptionProps('custom')}
        />
      </Fieldset>

      <Fieldset
        className={cn(styles.customRange, {
          active: radioValue === 'custom',
        })}
      >
        <div className={styles.dateField}>
          <label className={styles.dateLabel}>
            <span>{t('common.fromDate')}</span>
            <input
              type="date"
              className={cn(styles.dateInput)}
              value={customFromValue}
              onFocus={() => selectOption('custom')}
              onChange={(e) => setCustomRange(e.target.value, customToValue)}
            />
          </label>
        </div>

        <div className={styles.dateField}>
          <label className={styles.dateLabel}>
            <span>{t('common.toDate')}</span>
            <input
              type="date"
              className={styles.dateInput}
              value={customToValue}
              onFocus={() => selectOption('custom')}
              onChange={(e) => setCustomRange(customFromValue, e.target.value)}
            />
          </label>
        </div>
      </Fieldset>
    </EinDropdown>
  );
}
