'use client';

import { Button } from '@digdir/designsystemet-react';
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@navikt/aksel-icons';
import { useCallback, useRef, useState } from 'react';
import { EinLink } from '~/components/EinLink/EinLink';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import EnhetSelector from '~/components/SearchField/EnhetSelector';
import useBreakpoint from '~/hooks/useBreakpoint';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { isStandardClick } from '~/lib/utils/isStandardClick';
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
  const {
    searchQuery,
    setSearchQuery,
    pushSearchQuery,
    dormant,
    searchOrigin,
    searchTarget,
  } = useSearchField();
  const navigation = useNavigation();
  const { previousPathname, previousSearchParamsString } = navigation;
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

  // Prefer `back()` when the search really is the previous history entry: it
  // reuses the router cache and lets the browser restore the result list's
  // scroll position, which a fresh push cannot. Deeper chains
  // (`search → saksmappe → journalpost`) fall back to a push.
  const handleBackToSearch = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (!isStandardClick(event) || event.defaultPrevented) {
        return;
      }

      const previousUrl = previousSearchParamsString
        ? `${previousPathname}?${previousSearchParamsString}`
        : previousPathname;

      if (previousUrl === searchOrigin) {
        event.preventDefault();
        navigation.back();
      }
      // Otherwise let EinLink push `searchOrigin` as normal.
    },
    [navigation, previousPathname, previousSearchParamsString, searchOrigin],
  );

  const showClearButton =
    !!searchQuery && (!activeContainer || activeContainer === 'searchQuery');

  // The magnifying glass is decorative; on a detail page its slot becomes the
  // way back to the results. It stays visible on mobile, where the decorative
  // icon is dropped for space, because it is the primary way back.
  const searchQueryIcon =
    dormant && searchOrigin ? (
      <EinLink
        href={searchOrigin}
        unstyled
        className={cn(styles.backToSearchLink)}
        onClick={handleBackToSearch}
        aria-label={t('search.backToResults')}
      >
        <ArrowLeftIcon aria-hidden="true" />
      </EinLink>
    ) : (
      !isMobileLayout && (
        <MagnifyingGlassIcon
          className={cn(styles.searchIcon)}
          aria-hidden="true"
        />
      )
    );

  const enhetSelector = (
    <EnhetSelector
      active={activeContainer === 'enhetSelector'}
      activate={activateEnhetSelectorContainer}
      close={deactivateContainer}
    />
  );

  return (
    <form
      className={cn(styles.searchFieldContainer, className, {
        [styles.dormant]: dormant,
      })}
      method="get"
      onSubmit={onSubmit}
      action={searchTarget.pathname}
      ref={containerRef}
    >
      {/* Include current query parameters as hidden inputs. On a detail page
          these come from the remembered search, so a no-JS submit lands back on
          the results rather than on `/case/abc?q=…`. */}
      {Array.from(searchTarget.searchParams.entries()).map(
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
              icon={searchQueryIcon}
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
