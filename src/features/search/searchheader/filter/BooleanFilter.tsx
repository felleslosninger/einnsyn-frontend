import { Switch } from '@digdir/designsystemet-react';
import { useCallback } from 'react';
import cn from '~/lib/utils/className';
import styles from './BooleanFilter.module.scss';

/**
 * Renders a Switch (toggle) that controls a boolean value in the URL search parameters.
 */
export function BooleanFilter({
  className,
  label,
  defaultValue = false,
  trueValue = 'true',
  falseValue = 'false',
  value,
  setValue,
}: {
  className?: string;
  label: string;
  defaultValue?: boolean;
  trueValue?: string;
  falseValue?: string;
  value?: string;
  setValue?: (value: string | undefined) => void;
}) {
  const isChecked = value === undefined ? defaultValue : value === trueValue;

  // Handles the change event from the Switch component.
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const checked = event.target.checked;
      setValue?.(
        checked === defaultValue ? undefined : checked ? trueValue : falseValue,
      );
    },
    [defaultValue, trueValue, falseValue, setValue],
  );

  return (
    <Switch
      className={cn(styles.booleanFilter, 'dropdown-option', className)}
      checked={isChecked}
      onChange={handleChange}
      label={label}
      position="end"
    >
      {label}
    </Switch>
  );
}
