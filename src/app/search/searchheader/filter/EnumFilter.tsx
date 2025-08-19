import { Checkbox, Fieldset } from '@digdir/designsystemet-react';
import { useCallback, useState } from 'react';
import { EinDropdown } from '~/components/EinDropdown';
import cn from '~/lib/utils/className';
import styles from './EnumFilter.module.scss';

type Option = {
  value: string;
  label: string;
  isAll?: boolean;
};

/**
 * Renders a dropdown filter with multiple checkboxes for a given property.
 * It uses the URL search parameters as the single source of truth and provides
 * optimistic UI updates for a responsive user experience.
 */
export function EnumFilter({
  className,
  label,
  options,
  initialValue,
  setValue,
}: {
  className?: string;
  label: string;
  options: Option[];
  initialValue?: string;
  setValue?: (value: string | undefined) => void;
}) {
  const [selectedValues, setSelectedValues] = useState(() => {
    return new Set(initialValue ? initialValue.split(',') : []);
  });

  const handleChange = useCallback(
    (toggledValue: string, isChecked: boolean) => {
      const newSelectedValues = new Set(selectedValues);
      if (isChecked) {
        newSelectedValues.add(toggledValue);
      } else {
        newSelectedValues.delete(toggledValue);
      }
      setSelectedValues(newSelectedValues);
      const valueString = Array.from(newSelectedValues).sort().join(',');
      setValue?.(valueString);
    },
    [selectedValues, setValue],
  );

  return (
    <EinDropdown
      trigger={label}
      showChevron
      className={cn(styles.enumFilter, className, 'dropdown-option')}
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
      <Fieldset>
        {options.map((option) => (
          <Checkbox
            key={option.value}
            value={option.value}
            label={option.label}
            checked={selectedValues.has(option.value)}
            onChange={(e) =>
              handleChange(option.value, e.currentTarget.checked)
            }
            className={styles.enumFilterCheckbox}
          >
            {option.label}
          </Checkbox>
        ))}
      </Fieldset>
    </EinDropdown>
  );
}
