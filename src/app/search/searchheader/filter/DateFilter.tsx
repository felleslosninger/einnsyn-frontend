'use client';

import { Fieldset, Radio, useRadioGroup } from '@digdir/designsystemet-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
 * Integrates with a global optimistic search parameter system.
 */
export function DateFilter({
  className,
  label,
  defaultValue = 'all',
  initialValue = defaultValue,
  setValue,
}: {
  className?: string;
  label: string;
  defaultValue?: string;
  initialValue?: string;
  setValue?: (value: string | undefined) => void;
}) {
  const t = useTranslation();
  const [initialRadioValue, initialFrom, initialTo] = useMemo(
    () => parseCurrentValue(initialValue, defaultValue),
    [initialValue, defaultValue],
  );

  const [customFromValue, setCustomFromValue] = useState(initialFrom ?? '');
  const [customToValue, setCustomToValue] = useState(initialTo ?? '');
  const customValue = useMemo(() => {
    const from = customFromValue || '';
    const to = customToValue || '';
    return from || to ? `${from}/${to}` : '';
  }, [customFromValue, customToValue]);

  const {
    getRadioProps,
    value: radioValue,
    setValue: setRadioValue,
  } = useRadioGroup({
    value: initialRadioValue ?? defaultValue,
  });

  // Update currentValue
  const currentValue = useMemo(() => {
    if (radioValue === 'custom') {
      return customValue;
    }
    return radioValue;
  }, [radioValue, customValue]);

  const focusOnCustom = useCallback(() => {
    setRadioValue('custom');
  }, [setRadioValue]);

  useEffect(() => {
    setValue?.(currentValue === defaultValue ? undefined : currentValue);
  }, [setValue, currentValue, defaultValue]);

  return (
    <EinDropdown
      trigger={label}
      showChevron
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
          {...getRadioProps('all')}
        />
        <div className={cn('spacer')} />
        <Radio
          label={t('searchFilters.datePresets.pastDay')}
          className={cn(styles.radioOption, {
            active: radioValue === '-24h',
          })}
          {...getRadioProps('-24h')}
        />
        <Radio
          label={t('searchFilters.datePresets.pastWeek')}
          className={cn(styles.radioOption, {
            active: radioValue === '-7d',
          })}
          {...getRadioProps('-7d')}
        />
        <Radio
          label={t('searchFilters.datePresets.pastMonth')}
          className={cn(styles.radioOption, {
            active: radioValue === '-1m',
          })}
          {...getRadioProps('-1m')}
        />
        <Radio
          label={t('searchFilters.datePresets.pastYear')}
          className={cn(styles.radioOption, {
            active: radioValue === '-1y',
          })}
          {...getRadioProps('-1y')}
        />
        <div className={cn('spacer')} />
        <Radio
          label={t('searchFilters.datePresets.customRange')}
          className={cn(styles.radioOption, {
            active: radioValue === 'custom',
          })}
          {...getRadioProps('custom')}
        />
      </Fieldset>

      <Fieldset
        className={cn(styles.customRange, {
          active: radioValue === 'custom',
        })}
      >
        <div className={styles.dateField}>
          <label className={styles.dateLabel}>
            <span>From</span>
            <input
              type="date"
              className={cn(styles.dateInput)}
              value={customFromValue}
              onFocus={focusOnCustom}
              onChange={(e) => setCustomFromValue(e.target.value)}
            />
          </label>
        </div>

        <div className={styles.dateField}>
          <label className={styles.dateLabel}>
            <span>To</span>
            <input
              type="date"
              className={styles.dateInput}
              value={customToValue}
              onFocus={focusOnCustom}
              onChange={(e) => setCustomToValue(e.target.value)}
            />
          </label>
        </div>
      </Fieldset>
    </EinDropdown>
  );
}
