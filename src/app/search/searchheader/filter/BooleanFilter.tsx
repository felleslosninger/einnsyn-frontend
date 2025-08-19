import { Switch } from '@digdir/designsystemet-react';
import { useCallback, useMemo } from 'react';
import {
  useNavigation,
  useOptimisticPathname,
  useOptimisticSearchParams,
} from '~/components/NavigationProvider/NavigationProvider';
import cn from '~/lib/utils/className';
import styles from './BooleanFilter.module.scss';

/**
 * Renders a Switch (toggle) that controls a boolean value in the URL search parameters.
 */
export function BooleanFilter({
  className,
  label,
  property,
  defaultValue = false,
}: {
  className?: string;
  label: string;
  property: string;
  defaultValue?: boolean;
}) {
  const navigation = useNavigation();
  const pathname = useOptimisticPathname();
  const searchParams = useOptimisticSearchParams();

  // The canonical state is derived directly from the URL.
  // This value represents the committed state of the filter.
  const isChecked = useMemo(() => {
    const paramValue = searchParams.get(property);
    // If the URL param is not present, use the default. Otherwise, parse it as a boolean.
    return paramValue === null ? defaultValue : paramValue === 'true';
  }, [searchParams, property, defaultValue]);

  // Handles the change event from the Switch component.
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newIsChecked = event.target.checked;

      const newSearchParams = new URLSearchParams(searchParams.toString());

      // Remove the property if the new value is the default.
      if (newIsChecked === defaultValue) {
        newSearchParams.delete(property);
      } else {
        newSearchParams.set(property, String(newIsChecked));
      }

      // Update the URL. `replace` is used to avoid adding filter changes to browser history.
      navigation.replace(`${pathname}?${newSearchParams.toString()}`, {
        scroll: false,
      });
    },
    [defaultValue, property, pathname, navigation, searchParams],
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
