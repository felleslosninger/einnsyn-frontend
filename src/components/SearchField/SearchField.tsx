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
    backToSearchHref,
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

      if (previousUrl === backToSearchHref) {
        event.preventDefault();
        navigation.back();
      }
      // Otherwise let EinLink push the remembered search as normal.
    },
    [
      navigation,
      previousPathname,
      previousSearchParamsString,
      backToSearchHref,
    ],
  );

  const showClearButton =
    !backToSearchHref &&
    !!searchQuery &&
    (!activeContainer || activeContainer === 'searchQuery');

  // The magnifying glass is decorative, and dropped on mobile for space.
  const searchQueryIcon = !isMobileLayout && (
    <MagnifyingGlassIcon className={cn(styles.searchIcon)} aria-hidden="true" />
  );

  // On a page reached from a search the query is not this page's to show, so
  // the field's contents are the way back to it instead. Everything around them
  // — the pill, the enhet selector, the submit button — is unchanged, and still
  // acts on the remembered search.
  const searchQueryContent = backToSearchHref ? (
    <EinLink
      href={backToSearchHref}
      className={cn(styles.backToSearch)}
      onClick={handleBackToSearch}
      unstyled
    >
      <ArrowLeftIcon
        className={cn(styles.backToSearchIcon)}
        aria-hidden="true"
      />
      <span className={cn(styles.backToSearchLabel)}>
        {t('search.backToResults')}
      </span>
    </EinLink>
  ) : (
    <>
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
          <XMarkIcon className={cn(styles.clearIcon)} aria-hidden="true" />
        </Button>
      )}
    </>
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
      className={cn(styles.searchFieldContainer, className)}
      method="get"
      onSubmit={onSubmit}
      action={searchTarget.pathname}
      ref={containerRef}
    >
      {/* Include current query parameters as hidden inputs. On a detail page
          these come from the remembered search, so a no-JS submit lands back on
          the results rather than on `/case/abc?q=…`. `q` travels in the
          textarea, except while the back link stands in for it. */}
      {Array.from(searchTarget.searchParams.entries()).map(
        ([key, value]) =>
          (key !== 'q' || !!backToSearchHref) && (
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
            {searchQueryContent}
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
