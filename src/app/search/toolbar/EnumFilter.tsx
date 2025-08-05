import { Checkbox, Fieldset } from '@digdir/designsystemet-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { startTransition, useCallback, useMemo, useOptimistic } from 'react';
import { EinDropdown } from '~/components/EinDropdown';
import cn from '~/lib/utils/className';
import styles from './EnumFilter.module.scss';

type Option = {
  value: string;
  label: string;
  isAll?: boolean;
};

/**
 * A pure function to calculate the next selection state based on a toggled checkbox.
 * @param currentSelection - The current Set of selected values.
 * @param action - An object describing the user's interaction.
 * @returns A new Set representing the updated selection.
 */
const getNextSelectedValues = (
  currentSelection: Set<string>,
  action: {
    toggledValue: string;
    isChecked: boolean;
    allOption?: Option;
    regularOptions: Option[];
  },
): Set<string> => {
  const { toggledValue, isChecked, allOption, regularOptions } = action;
  const newSelection = new Set(currentSelection);

  if (allOption && toggledValue === allOption.value) {
    // If the "All" option is toggled, either select all regular options or clear the selection.
    if (isChecked) {
      regularOptions.forEach((opt) => newSelection.add(opt.value));
    } else {
      newSelection.clear();
    }
  } else {
    // If a regular option is toggled, add or remove it from the set.
    if (isChecked) {
      newSelection.add(toggledValue);
    } else {
      newSelection.delete(toggledValue);
    }
  }

  return newSelection;
};

/**
 * Renders a dropdown filter with multiple checkboxes for a given property.
 * It uses the URL search parameters as the single source of truth and provides
 * optimistic UI updates for a responsive user experience.
 */
export function EnumFilter({
  className,
  label,
  property,
  options,
  defaultAll = true,
}: {
  className?: string;
  label: string;
  property: string;
  options: Option[];
  defaultAll?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Memoize derived option lists to avoid re-calculating on every render.
  const { allOption, regularOptions } = useMemo(() => {
    const allOpt = options.find((o) => o.isAll);
    const regOpts = options.filter((o) => !o.isAll);
    return { allOption: allOpt, regularOptions: regOpts };
  }, [options]);

  // The canonical state is derived directly from the URL search parameters.
  const selectedValuesFromUrl = useMemo(() => {
    const paramValue = searchParams.get(property);
    return new Set(paramValue ? paramValue.split(',') : []);
  }, [searchParams, property]);

  // Provides immediate UI feedback by applying user changes before the URL updates.
  // The reducer chains updates, ensuring multiple quick clicks are handled correctly.
  const [optimisticSelectedValues, setOptimisticSelectedValues] = useOptimistic(
    selectedValuesFromUrl,
    (
      currentOptimisticValues,
      action: { toggledValue: string; isChecked: boolean },
    ) =>
      getNextSelectedValues(currentOptimisticValues, {
        ...action,
        allOption,
        regularOptions,
      }),
  );

  // Derived state that converts the selection Set into a boolean map for rendering.
  // This map determines the `checked` status of each checkbox, including the "All" option.
  const selectionMap = useMemo(() => {
    const isAllEffectivelySelected =
      (defaultAll && optimisticSelectedValues.size === 0) ||
      (regularOptions.length > 0 &&
        regularOptions.every((o) => optimisticSelectedValues.has(o.value)));

    const map: Record<string, boolean> = {};
    for (const option of options) {
      if (option.isAll) {
        map[option.value] = isAllEffectivelySelected;
      } else {
        map[option.value] =
          isAllEffectivelySelected ||
          optimisticSelectedValues.has(option.value);
      }
    }
    return map;
  }, [optimisticSelectedValues, options, regularOptions, defaultAll]);

  // Handles checkbox changes, orchestrating the optimistic UI update and the URL navigation.
  const handleChange = useCallback(
    (toggledValue: string, isChecked: boolean) => {
      startTransition(() => {
        // Calculate the next state for the URL based on the current optimistic value.
        // This ensures rapid clicks are cumulative and prevents race conditions.
        const newSelectedValues = getNextSelectedValues(
          optimisticSelectedValues,
          { toggledValue, isChecked, allOption, regularOptions },
        );

        // Trigger the optimistic state update for instant UI feedback.
        setOptimisticSelectedValues({ toggledValue, isChecked });

        // Update the URL, which is the canonical source of truth.
        const params = new URLSearchParams(searchParams.toString());
        const sortedValues = Array.from(newSelectedValues).sort();

        if (sortedValues.length > 0) {
          params.set(property, sortedValues.join(','));
        } else {
          params.delete(property);
        }

        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [
      optimisticSelectedValues,
      setOptimisticSelectedValues,
      allOption,
      regularOptions,
      searchParams,
      property,
      router,
      pathname,
    ],
  );

  return (
    <EinDropdown
      trigger={label}
      className={cn(styles.enumFilter, className, 'dropdown-option')}
      preferredPosition={['right', 'left']}
    >
      <Fieldset>
        {options.map((option) => (
          <Checkbox
            key={option.value}
            value={option.value}
            label={option.label}
            checked={selectionMap[option.value] ?? false}
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
