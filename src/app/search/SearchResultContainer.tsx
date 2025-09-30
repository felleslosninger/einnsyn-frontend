'use client';

import { Skeleton, Card, Heading, Paragraph, Link, Button } from '@digdir/designsystemet-react';
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
import { EnvelopeClosedIcon, PhoneIcon, HouseIcon } from '@navikt/aksel-icons';


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
                    <span className={cn(styles.enhetHeader)}>
                      <Heading level={1} data-size='sm'>
                        {enhet.navn ?? 'Ukjent enhet'}
                      </Heading>
                      <Button
                        className={cn(styles.button)}
                        data-size={'x-sm'}
                        variant='tertiary'
                      >
                        Fjern filter
                        {/* TODO: add translation */}
                      </Button>
                    </span>
                    {/* 
                    <Heading
                      level={2} data-size='xs' className={cn('ds-heading', styles.statisticsHeader)}>
                      {t('statistics.header')}
                    </Heading> */}

                    <div data-size='sm'>
                      {enhet.kontaktpunktEpost && (
                        <Paragraph>
                          <Link href={`mailto:${enhet.kontaktpunktEpost}`}>
                            <span>
                              <EnvelopeClosedIcon title="a11y-title" aria-hidden="true" className={cn(styles.icon)} />
                              {enhet.kontaktpunktEpost}
                            </span>
                          </Link>
                        </Paragraph>
                      )}
                      {enhet.kontaktpunktTelefon && (
                        <Paragraph>
                          <Link href={`tel:${enhet.kontaktpunktTelefon}`}>
                            <span>
                              <PhoneIcon title="a11y-title" aria-hidden="true" className={cn(styles.icon)} />
                              {enhet.kontaktpunktTelefon} </span>
                          </Link>
                        </Paragraph>
                      )}
                      {enhet.kontaktpunktAdresse && (
                        <Paragraph>
                          <HouseIcon title="a11y-title" aria-hidden="true" className={cn(styles.icon, styles.iconAlignBottom)} />
                          {enhet.kontaktpunktAdresse}
                        </Paragraph>
                      )}
                    </div>
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
