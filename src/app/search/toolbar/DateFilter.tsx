'use client';

import { Fieldset, Radio } from '@digdir/designsystemet-react';
import { useCallback, useMemo } from 'react';
import { EinDropdown } from '~/components/EinDropdown';
import { useOptimisticSearchParams } from '~/lib/contexts/OptimisticSearchParamsContext';
import cn from '~/lib/utils/className';
import { formatDateForUrl } from '~/lib/utils/date';
import styles from './DateFilter.module.scss';

// Define the preset options for clarity and to avoid magic strings.
const PRESETS = [
  { value: 'all', label: 'All' },
  { value: '-24h', label: 'Last 24 hours' },
  { value: '-7d', label: 'Last week' },
  { value: '-1m', label: 'Last month' },
  { value: '-1y', label: 'Last year' },
];
const CUSTOM_VALUE = 'custom';

/**
 * A dropdown filter for selecting a date or date range.
 * Supports presets (e.g., "Last 7 days") and a custom date range.
 * Integrates with a global optimistic search parameter system.
 */
export function DateFilter({
  className,
  label,
  property,
  defaultValue = 'all',
}: {
  className?: string;
  label: string;
  property: string;
  defaultValue?: string;
}) {
  const { optimisticParams, updateSearchParams } = useOptimisticSearchParams();

  // The component's UI state is derived from the single URL parameter.
  const { selectedValue, startDate, endDate } = useMemo(() => {
    const paramValue = optimisticParams.get(property) ?? defaultValue;
    const isPreset = PRESETS.some((p) => p.value === paramValue);

    if (isPreset) {
      // If the URL value is a known preset, use it directly.
      return {
        selectedValue: paramValue,
        startDate: undefined,
        endDate: undefined,
      };
    } else {
      // Otherwise, the value must be a custom date range.
      // We expect the format "YYYY-MM-DD,YYYY-MM-DD".
      const [startStr, endStr] = paramValue.split(',');
      return {
        selectedValue: CUSTOM_VALUE,
        startDate: startStr ? new Date(startStr) : undefined,
        endDate: endStr ? new Date(endStr) : undefined,
      };
    }
  }, [optimisticParams, property, defaultValue]);

  /**
   * Handles changes to the preset radio buttons.
   */
  const handlePresetChange = useCallback(
    (value: string) => {
      // Don't update the URL if 'Custom' is selected; wait for date changes.
      if (value === CUSTOM_VALUE) return;

      const newParams = new URLSearchParams(optimisticParams.toString());

      if (value === defaultValue) {
        newParams.delete(property);
      } else {
        newParams.set(property, value);
      }
      updateSearchParams(newParams);
    },
    [optimisticParams, updateSearchParams, property, defaultValue],
  );

  /**
   * Handles changes to either of the custom date pickers.
   */
  const handleDateChange = useCallback(
    (newDate: Date | undefined, type: 'start' | 'end') => {
      const newStartDate = type === 'start' ? newDate : startDate;
      const newEndDate = type === 'end' ? newDate : endDate;

      // Only update the URL if both dates are selected.
      if (newStartDate && newEndDate) {
        const newParams = new URLSearchParams(optimisticParams.toString());
        const paramValue = `${formatDateForUrl(newStartDate)},${formatDateForUrl(newEndDate)}`;
        newParams.set(property, paramValue);
        updateSearchParams(newParams);
      }
    },
    [startDate, endDate, optimisticParams, updateSearchParams, property],
  );

  return (
    <EinDropdown
      trigger={label}
      className={cn(styles.dateFilter, className, 'dropdown-option')}
      preferredPosition={['right', 'left']}
    >
      <Fieldset
        value={selectedValue}
        onChange={handlePresetChange}
        className={styles.radioGroup}
      >
        <Radio value="all" label="All time" />
        <Radio value="-24h" label="Last 24 hours" />
        <Radio value="-7d" label="Last week" />
        <Radio value="-1m" label="Last month" />
        <Radio value="-1y" label="Last year" />
        <Radio value={CUSTOM_VALUE} label="Custom range" />
      </Fieldset>

      <Fieldset
        className={styles.customRange}
        // The custom date pickers are only enabled when 'Custom' is selected.
        disabled={selectedValue !== CUSTOM_VALUE}
      >
        <Fieldset.Legend>Custom date range</Fieldset.Legend>
        <label htmlFor={`${property}-start`}>From</label>
        <input
          id={`${property}-start`}
          type="date"
          onChange={(e) => handleDateChange(e, 'start')}
          className={styles.dateInput}
        />
        <label htmlFor={`${property}-end`}>To</label>
        <input
          id={`${property}-end`}
          type="date"
          onChange={(e) => handleDateChange(e, 'end')}
          className={styles.dateInput}
        />
      </Fieldset>
    </EinDropdown>
  );
}
