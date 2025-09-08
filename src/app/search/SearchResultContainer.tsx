'use client';

import { Skeleton, Card, Heading, Paragraph, Link } from '@digdir/designsystemet-react';
import type { Base, Enhet, PaginatedList } from '@digdir/einnsyn-sdk';
import { useCallback, useEffect, useState } from 'react';
import { EinScrollTrigger } from '~/components/EinScrollTrigger/EinScrollTrigger';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { fetchNextPage } from '~/lib/utils/pagination';
import styles from './SearchResultContainer.module.scss';
import SearchResult from './searchresult/SearchResult';
import { isEnhet } from '@digdir/einnsyn-sdk';
import EnhetLink from './searchresult/common/EnhetLink';


export default function SearchResultContainer({
  searchResults,
  enhetsObjektInfo = [],
}: {
  searchResults: PaginatedList<Base>;
  enhetsObjektInfo?: Enhet[];
}) {

  const t = useTranslation();
  const [currentSearchResults, setCurrentSearchResults] =
    useState<PaginatedList<Base>>(searchResults);

  // Update currentSearchResults when searchResults prop changes (new search)
  useEffect(() => {
    setCurrentSearchResults(searchResults);
  }, [searchResults]);

  const scrollTriggerHandler = useCallback(async () => {
    if (!currentSearchResults.next) {
      return; // No next page to fetch
    }
    const nextPageData = await fetchNextPage(currentSearchResults);
    setCurrentSearchResults(nextPageData);
  }, [currentSearchResults]);

  return (
    <div
      className={cn(
        'container-wrapper',
        'search-container',
        'main-content',
        styles.searchResultContainer,
      )}
    >
      <div className="container-pre collapsible" />
      <div className={cn(styles.searchResultContainer, 'container')}>
        <div className={cn(styles.searchResults, 'search-results')}>
          {searchResults.items.length ? (
            searchResults.items.map((item) => (
              <SearchResult key={item.id} item={item} />
            ))
          ) : (
            <div className="no-results">
              <p>{t('common.noResults')}</p>
            </div>
          )}

          {/* Conditionally render EinScrollTrigger only if there's a next page */}
          {currentSearchResults.next && (
            <EinScrollTrigger onEnter={scrollTriggerHandler}>
              <div className="search-result">
                <h2 className="ds-heading" data-size="lg">
                  <Skeleton variant="text">
                    A relatively long dummy title for loading skeleton
                  </Skeleton>
                </h2>
                <div className="ds-paragraph" data-size="sm">
                  <div>
                    <Skeleton variant="text">
                      - Journalpost – Published 01.01.1970
                    </Skeleton>
                  </div>
                  <div>
                    <Skeleton variant="text">eInnsyn dummy Enhet</Skeleton>
                  </div>
                  <div>
                    <Skeleton variant="text">Saksmappe: 123456789</Skeleton>
                  </div>
                </div>
              </div>
            </EinScrollTrigger>
          )}

        </div>

        <div className={cn(styles.searchResultSidebar, 'sidebar')}>

          {enhetsObjektInfo.length > 0 ? (
            enhetsObjektInfo
              .filter(isEnhet)
              .map((enhet) => (
                <div key={enhet.id}>
                  <Card data-color='neutral'>
                    <Heading><h2 className="ds-heading" data-size="md">{enhet.navn ?? 'Ukjent enhet'}</h2></Heading>
                    <Paragraph data-size='sm'>
                      {enhet.kontaktpunktEpost && (
                        <Paragraph>
                          <Link href={`mailto:${enhet.kontaktpunktEpost}`}>
                            {enhet.kontaktpunktEpost}
                          </Link>
                        </Paragraph>
                      )}
                      {enhet.kontaktpunktTelefon && (
                        <Paragraph>
                          Tlf:
                          <Link href={`tel:${enhet.kontaktpunktTelefon}`}>
                            {enhet.kontaktpunktTelefon}
                          </Link>
                        </Paragraph>
                      )}
                      {enhet.kontaktpunktAdresse && <Paragraph>{'' + enhet.kontaktpunktAdresse}</Paragraph>}
                      {/* {enhet.underenhet && enhet.underenhet.length > 0 && <p> {'Underenheter: ' + enhet.underenhet} </p>} */}
                      {/* {enhet.parent && <p> {'Overordnet enhet:' + enhet.parent}</p>} */}
                    </Paragraph>
                    <Paragraph data-size='xs'>
                      <div className="enhetstype"> {enhet.enhetstype && <span>{enhet.enhetstype}</span>} </div>
                    </Paragraph>
                  </Card>
                </div>
              ))
          ) : (
            <p></p>
          )}

        </div>

      </div>
      <div className="container-post" />
    </div>
  );
}
