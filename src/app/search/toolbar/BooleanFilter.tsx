import { Switch } from '@digdir/designsystemet-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { startTransition, useCallback, useMemo, useOptimistic } from 'react';
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The canonical state is derived directly from the URL.
  // This value represents the committed state of the filter.
  const isCheckedFromUrl = useMemo(() => {
    const paramValue = searchParams.get(property);
    // If the URL param is not present, use the default. Otherwise, parse it as a boolean.
    return paramValue === null ? defaultValue : paramValue === 'true';
  }, [searchParams, property, defaultValue]);

  // Provides immediate UI feedback by applying the change before the URL updates.
  // The reducer simply adopts the new boolean value provided by the user's action.
  const [optimisticChecked, setOptimisticChecked] = useOptimistic(
    isCheckedFromUrl,
    (_state, newChecked: boolean) => newChecked,
  );

  // Handles the change event from the Switch component.
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = event.target.checked;

      startTransition(() => {
        setOptimisticChecked(isChecked);
        const newSearchParams = new URLSearchParams(searchParams.toString());

        // For cleaner URLs, we only set the parameter if its value is not the default.
        if (isChecked === defaultValue) {
          newSearchParams.delete(property);
        } else {
          newSearchParams.set(property, String(isChecked));
        }

        // Update the URL. `replace` is used to avoid adding filter changes to browser history.
        router.replace(`${pathname}?${newSearchParams.toString()}`, {
          scroll: false,
        });
      });
    },
    [
      defaultValue,
      property,
      pathname,
      router,
      searchParams,
      setOptimisticChecked,
    ],
  );

  return (
    <Switch
      className={cn(styles.booleanFilter, 'dropdown-option', className)}
      checked={optimisticChecked}
      onChange={handleChange}
      label={label}
      position="end"
    >
      {label}
    </Switch>
  );
}
