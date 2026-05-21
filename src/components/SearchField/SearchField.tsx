'use client';

import { Button } from '@digdir/designsystemet-react';
import { MagnifyingGlassIcon, XMarkIcon } from '@navikt/aksel-icons';
import { useCallback, useRef, useState } from 'react';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import EnhetSelector from '~/components/SearchField/EnhetSelector';
import useBreakpoint from '~/hooks/useBreakpoint';
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
  const isMobileLayout = useBreakpoint('SM');
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

  const enhetSelector = (
    <EnhetSelector
      active={activeContainer === 'enhetSelector'}
      activate={activateEnhetSelectorContainer}
      close={deactivateContainer}
      layout={isMobileLayout ? 'mobile' : 'desktop'}
    />
  );

  return (
    <form
      className={cn(styles.searchFieldContainer, className)}
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
        className={cn(styles.pillRow, {
          [styles.hasActiveContainer]: isMobileLayout
            ? activeContainer === 'searchQuery'
            : activeContainer !== undefined,
        })}
      >
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
              icon={ !isMobileLayout &&
                <MagnifyingGlassIcon
                  className={cn(styles.searchIcon)}
                  aria-hidden="true"
                />
              }
              value={searchQuery}
              setValue={setSearchQuery}
              onFocus={activateSearchQueryContainer}
              onBlur={deactivateContainer}
              placeholder={t('search.placeholder')}
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
                <XMarkIcon
                  className={cn(styles.clearIcon)}
                  aria-hidden="true"
                />
              </Button>
            )}
          </div>
        </div>

        {!isMobileLayout && (
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
              {enhetSelector}
            </div>
          </div>
        )}

        <div
          className={cn(styles.actionButtonContainer, {
            [styles.withBorder]: !!searchQuery,
          })}
        >
          <EinButton
            variant="primary"
            type="submit"
            className={cn({ [styles.iconOnlySubmit]: isMobileLayout })}
            aria-label={isMobileLayout ? t('search.button') : undefined}
          >
            {isMobileLayout ? (
              <MagnifyingGlassIcon
                className={cn(styles.submitIcon)}
                aria-hidden="true"
              />
            ) : (
              t('search.button')
            )}
          </EinButton>
        </div>
      </div>

      {isMobileLayout && (
        <div className={styles.enhetSelectorMobileRow}>{enhetSelector}</div>
      )}
    </form>
  );
};
