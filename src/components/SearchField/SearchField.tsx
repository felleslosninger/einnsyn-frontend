'use client';

import { Button } from '@digdir/designsystemet-react';
import { MagnifyingGlassIcon, XMarkIcon } from '@navikt/aksel-icons';
import { useCallback, useRef, useState } from 'react';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import EnhetSelector from '~/components/SearchField/EnhetSelector';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { EinButton } from '../EinButton/EinButton';
import styles from './SearchField.module.scss';
import { useSearchField } from './SearchFieldProvider';
import { StyledInput } from './StyledInput';

type SearchFieldProps = {
  className?: string;
};

export const SearchField = ({ className }: SearchFieldProps) => {
  const t = useTranslation();
  const containerRef = useRef<HTMLFormElement>(null);
  const { searchQuery, setSearchQuery, pushSearchQuery } = useSearchField();
  const { optimisticPathname, optimisticSearchParams } = useNavigation();
  const [activeContainer, setActiveContainer] = useState<string | undefined>(
    undefined,
  );

  const activateSearchQueryContainer = useCallback(() => {
    setActiveContainer('searchQuery');
  }, []);

  const activateEnhetSelectorContainer = useCallback(() => {
    setActiveContainer('enhetSelector');
  }, []);

  const deactivateContainer = useCallback(() => {
    setActiveContainer(undefined);
  }, []);

  const onSubmit = useCallback(
    (event: React.SubmitEvent<HTMLFormElement>) => {
      pushSearchQuery(searchQuery);
      event.preventDefault();
    },
    [searchQuery, pushSearchQuery],
  );

  const handleClear = useCallback(() => {
    setSearchQuery('');
  }, [setSearchQuery]);

  const showClearButton =
    !!searchQuery && (!activeContainer || activeContainer === 'searchQuery');

  return (
    <form
      className={cn(styles.searchFieldContainer, className, {
        [styles.hasActiveContainer]: activeContainer !== undefined,
      })}
      data-search-field-container="true"
      method="get"
      onSubmit={onSubmit}
      action={optimisticPathname}
      ref={containerRef}
    >
      {/* Include current query parameters as hidden inputs */}
      {Array.from(optimisticSearchParams?.entries() ?? []).map(
        ([key, value]) =>
          key !== 'q' && (
            <input key={key} type="hidden" name={key} value={value} />
          ),
      )}

      <div
        className={cn(
          styles.searchQueryContainer,
          styles.searchInputContainer,
          styles.searchInputWithIcon,
          { [styles.activeContainer]: activeContainer === 'searchQuery' },
        )}
        data-styled-input-width-animated="true"
      >
        <div
          className={cn(styles.expandableInputContainer)}
          data-styled-input-expandable="true"
        >
          <StyledInput
            icon={
              <MagnifyingGlassIcon
                className={cn(styles.searchIcon)}
                aria-hidden="true"
              />
            }
            value={searchQuery}
            setValue={setSearchQuery}
            onFocus={activateSearchQueryContainer}
            onBlur={deactivateContainer}
            name="q"
          />

          {showClearButton && (
            <Button
              className={cn(styles.clearButton)}
              type="button"
              onClick={handleClear}
              aria-label={t('search.clear')}
              variant="tertiary"
            >
              <XMarkIcon className={cn(styles.clearIcon)} aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      <div
        className={cn(
          styles.enhetSelectorContainer,
          styles.searchInputContainer,
          { [styles.activeContainer]: activeContainer === 'enhetSelector' },
        )}
        data-enhet-selector-container="true"
        data-styled-input-width-animated="true"
      >
        <div className={cn(styles.expandableInputContainer)}>
          <EnhetSelector
            active={activeContainer === 'enhetSelector'}
            activate={activateEnhetSelectorContainer}
            close={deactivateContainer}
          />
        </div>
      </div>

      <div
        className={cn(styles.actionButtonContainer, {
          [styles.withBorder]: !!searchQuery,
        })}
      >
        <EinButton variant="primary" type="submit">
          {t('search.button')}
        </EinButton>
      </div>
    </form>
  );
};
