'use client';

import {
  type Base,
  type Enhet,
  isEnhet,
  isJournalpost,
  isMoetemappe,
  isMoetesak,
  isSaksmappe,
  type PaginatedList,
} from '@digdir/einnsyn-sdk';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { EinScrollTrigger } from '~/components/EinScrollTrigger/EinScrollTrigger';
import {
  EinTransition,
  type EinTransitionEvents,
} from '~/components/EinTransition/EinTransition';
import { seedEnhets } from '~/components/EnhetProvider/enhetStore';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import { useSearchField } from '~/components/SearchField/SearchFieldProvider';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import { type TrimmedEnhet, toTrimmedEnhet } from '~/lib/enhet/enhet';
import { getPathEnhet } from '~/lib/routing/pathname';
import { getEnhetSelection } from '~/lib/routing/searchParams';
import { getIntlLocale } from '~/lib/translation/translation';
import cn from '~/lib/utils/className';
import { fetchNextPage, mergeWindow } from '~/lib/utils/pagination';
import SaveSearchDropdown from './SaveSearchDropdown';
import styles from './SearchResultContainer.module.scss';
import SelectedEnhetPanel from './SelectedEnhetPanel';
import SearchResult from './searchresult/SearchResult';
import { SearchResultSkeleton } from './searchresult/SearchResultSkeleton';
import resultStyles from './searchresult/searchResultStyles.module.scss';

/** The enhets the results link to, with the parent chains the search expands. */
function getLinkedEnhets(items: readonly Base[]): TrimmedEnhet[] {
  const enhetsById = new Map<string, TrimmedEnhet>();
  for (const item of items) {
    let current: Enhet | string | undefined =
      isSaksmappe(item) || isJournalpost(item)
        ? item.administrativEnhetObjekt
        : isMoetemappe(item) || isMoetesak(item)
          ? item.utvalgObjekt
          : undefined;
    // A seen enhet has had its chain walked already.
    while (isEnhet(current) && !enhetsById.has(current.id)) {
      enhetsById.set(current.id, toTrimmedEnhet(current));
      current = current.parent;
    }
  }
  return Array.from(enhetsById.values());
}

function getResultCountKey(capped: boolean, enhetCount: number) {
  if (enhetCount === 0) {
    return capped ? 'search.resultCountCappedAll' : 'search.resultCountAll';
  }
  if (enhetCount === 1) {
    return capped
      ? 'search.resultCountCappedEnhetSingular'
      : 'search.resultCountEnhetSingular';
  }
  return capped
    ? 'search.resultCountCappedEnhetPlural'
    : 'search.resultCountEnhetPlural';
}

function SearchResultCount({
  total,
  enhetCount,
}: {
  total: PaginatedList<Base>['total'];
  enhetCount: number;
}) {
  const t = useTranslation();
  const languageCode = useLanguageCode();
  if (!total) {
    return null;
  }
  const count = new Intl.NumberFormat(getIntlLocale(languageCode)).format(
    total.value,
  );
  const [before, strong, after] = t(
    getResultCountKey(total.capped, enhetCount),
    count,
  ).split(/<\/?strong>/);
  return (
    <p className={styles.resultCount}>
      {before}
      <strong>{strong}</strong>
      {after}
    </p>
  );
}

export default function SearchResultContainer({
  searchResults,
}: {
  searchResults: PaginatedList<Base>;
}) {
  const t = useTranslation();
  const {
    loadingPathname,
    pathname,
    searchParams,
    loadingSearchParamsString,
    searchParamsString,
    loading,
  } = useNavigation();
  // The search's own selection, which holds still while navigating to a hit.
  const { searchTarget } = useSearchField();
  const enhetIds = useMemo(
    () =>
      getEnhetSelection(
        getPathEnhet(searchTarget.pathname),
        searchTarget.searchParams,
      ),
    [searchTarget],
  );
  const [currentSearchResults, setCurrentSearchResults] =
    useState<PaginatedList<Base>>(searchResults);
  const isLoading =
    loading &&
    (loadingPathname !== pathname ||
      loadingSearchParamsString !== searchParamsString);

  // While loading, only the transition's frozen copy of the page is visible,
  // so the enhet panel can't fade its cards out itself. Flag the copy when
  // the selection is what changed, and its styles fade them.
  const enhetsChanging =
    enhetIds.join('|') !==
    getEnhetSelection(getPathEnhet(pathname), searchParams).join('|');
  const enhetsChangingRef = useRef(enhetsChanging);
  useLayoutEffect(() => {
    enhetsChangingRef.current = enhetsChanging;
  });
  const transitionEvents = useMemo<EinTransitionEvents>(
    () => ({
      onInitTransition: (snapshot) => {
        if (enhetsChangingRef.current) {
          // Style the fresh copy first, or there is nothing to fade from.
          snapshot.getBoundingClientRect();
          snapshot.dataset.enhetsChanging = '';
        }
      },
    }),
    [],
  );

  const searchSymbolRef = useRef<symbol>(Symbol());
  const searchKey = `${pathname}?${searchParamsString}`;
  const searchKeyRef = useRef(searchKey);

  // A new search starts the list over. A refresh of the same search (e.g.
  // after logging in) keeps the pages already loaded.
  useEffect(() => {
    const sameSearch = searchKeyRef.current === searchKey;
    searchKeyRef.current = searchKey;
    searchSymbolRef.current = Symbol();
    setCurrentSearchResults((current) => {
      if (current === searchResults) {
        return current;
      }
      return sameSearch ? mergeWindow(current, searchResults) : searchResults;
    });
  }, [searchResults, searchKey]);

  // The header layout seeds the enhet selector only on a full load, so an enhet
  // reached through a result's link has to be in the store before the click.
  useEffect(() => {
    seedEnhets(getLinkedEnhets(currentSearchResults.items));
  }, [currentSearchResults]);

  const scrollTriggerHandler = useCallback(async () => {
    if (!currentSearchResults.next) {
      return; // No next page to fetch
    }
    const newSearchSymbol = Symbol();
    searchSymbolRef.current = newSearchSymbol;
    const nextPageData = await fetchNextPage(currentSearchResults);

    // Discard this result if a new search has been initiated
    if (searchSymbolRef.current !== newSearchSymbol) {
      return;
    }

    setCurrentSearchResults(nextPageData);
  }, [currentSearchResults]);

  return (
    <EinTransition loading={isLoading} withClassNames events={transitionEvents}>
      <div
        className={cn(
          'container-wrapper',
          'main-content',
          styles.searchContainer,
        )}
      >
        <div className="container-pre collapsible" />
        <div className="container">
          <div className={styles.resultsLayout}>
            <div className={styles.results}>
              <div
                className={styles.toolbar}
                data-size="sm"
                data-color="neutral"
              >
                <SearchResultCount
                  total={currentSearchResults.total}
                  enhetCount={enhetIds.length}
                />
                <SaveSearchDropdown className={styles.saveSearch} />
              </div>
              <div
                className={resultStyles.searchResults}
                aria-busy={isLoading}
                aria-live="polite"
              >
                {currentSearchResults.items.length ? (
                  currentSearchResults.items.map((item) => (
                    <SearchResult
                      className={styles.searchResult}
                      key={item.id}
                      item={item}
                    />
                  ))
                ) : (
                  <div className={cn(styles.searchResult, 'no-results')}>
                    <p>{t('common.noResults')}</p>
                  </div>
                )}
                {currentSearchResults.next && (
                  <EinScrollTrigger onEnter={scrollTriggerHandler}>
                    <SearchResultSkeleton
                      className={styles.searchResult}
                      index={0}
                    />
                    <SearchResultSkeleton
                      className={styles.searchResult}
                      index={1}
                    />
                  </EinScrollTrigger>
                )}
              </div>
            </div>
            {enhetIds.length > 0 && <SelectedEnhetPanel enhetIds={enhetIds} />}
          </div>
        </div>
        <div className="container-post"></div>
      </div>
    </EinTransition>
  );
}
