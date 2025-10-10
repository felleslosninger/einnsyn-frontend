'use client';

import { Skeleton, Card, Heading, Paragraph, Link, Details } from '@digdir/designsystemet-react';
import type { Base, Enhet, PaginatedList } from '@digdir/einnsyn-sdk';
import { useCallback, useEffect, useState } from 'react';
import { EinScrollTrigger } from '~/components/EinScrollTrigger/EinScrollTrigger';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { fetchNextPage } from '~/lib/utils/pagination';
import styles from './SearchResultContainer.module.scss';
import SearchResult from './searchresult/SearchResult';
import { isEnhet } from '@digdir/einnsyn-sdk';
import { EnvelopeClosedIcon, PhoneIcon, HouseIcon } from '@navikt/aksel-icons';


export default function SearchResultContainer({
  searchResults,
  enhetsObjektInfo = [],
  enhetStats,
}: {
  searchResults: PaginatedList<Base>;
  enhetsObjektInfo?: Enhet[];
  enhetStats?: {
    readonly innsynskrav?: {
      readonly count: number;
      readonly interval: number;
      readonly bucket: Array<{
        readonly time: string;
        readonly count: number;
      }>;
    };
    readonly download?: {
      readonly count: number;
      readonly interval: number;
      readonly bucket: Array<{
        readonly time: string;
        readonly count: number;
      }>;
    };
  } | null;
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
      <div className={cn(styles.pre, 'container-pre collapsible')} />
      <div className={cn(styles.searchResultContainer, 'container')}>
        <div className={cn(styles.searchResults, 'search-results')}>
          {currentSearchResults.items.length ? (
            currentSearchResults.items.map((item) => (
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
      </div>
      <div className="container-post">
        <div className={cn(styles.searchResultSidebar, 'sidebar')}>

          {enhetsObjektInfo.length > 0 ? (
            enhetsObjektInfo
              .filter(isEnhet)
              .map((enhet) => (
                <div key={enhet.id}>
                  <Card data-color='neutral'>

                    <Card.Block>
                      <Heading level={1} data-size='sm'>
                        {enhet.navn ?? 'Ukjent enhet'}
                      </Heading>

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
                    </Card.Block>
                    <Details>
                      <Details.Summary>
                        {t('statistics.header')}
                      </Details.Summary>
                      <Details.Content>
                        {enhetStats ? (
                          <div className='statisticsdiv'>
                            <h2 className="ds-heading" data-size="sm">{t('statistics.innsynskrav')}</h2>
                            <p>{t('searchFilters.datePresets.pastYear')}: {enhetStats.innsynskrav?.count}</p>
                            <p>{t('searchFilters.datePresets.pastMonth')}: {enhetStats.innsynskrav?.count}</p>
                          </div>
                        ) : (
                          <p>{t('statistics.noData')}</p>
                        )}
                      </Details.Content>
                    </Details>
                  </Card>
                </div>
              ))
          ) : (
            <p></p>
          )}
        </div>
      </div>
    </div>
  );
}
