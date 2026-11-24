'use client';

import { Paragraph } from '@digdir/designsystemet-react';
import type {
  LagretSoek,
  PaginatedList,
  SavedSearchParameters,
} from '@digdir/einnsyn-sdk';
import { useCallback, useRef, useState } from 'react';
import { EinScrollTrigger } from '~/components/EinScrollTrigger/EinScrollTrigger';
import { useTranslation } from '~/hooks/useTranslation';
import { toJournalposttypeShorthand } from '~/lib/routing/journalposttype';
import { fetchNextPage } from '~/lib/utils/pagination';
import { serializeParamList } from '~/lib/utils/paramList';
import { tokensToSearchQuery } from '~/lib/utils/searchStringTokenizer';
import styles from './SavedSearches.module.scss';
import { SavedSearchItem } from './SavedSearchItem';
import { SavedSearchesListSkeleton } from './SavedSearchItemSkeleton';

// Date math units the search field writes differently: month is `M` in date
// math but `m` in the search field.
const DATE_MATH_UNITS: Record<string, string> = {
  M: 'm',
  h: 'h',
  d: 'd',
  w: 'w',
  y: 'y',
};

/**
 * A saved date as the search field writes it: relative date math
 * (`now-7d/d`) back to `-7d`, and a timestamp back to its date.
 */
function toSearchFieldDate(value: unknown): string {
  if (typeof value !== 'string') return '';
  const relative = value.match(/^now-(\d+)([Mhdwy])(?:\/d)?$/);
  if (relative) return `-${relative[1]}${DATE_MATH_UNITS[relative[2]]}`;
  return value.slice(0, 10);
}

function dateToken(prefix: string, fromValue: unknown, toValue: unknown) {
  const from = toSearchFieldDate(fromValue);
  const to = toSearchFieldDate(toValue);
  if (!from && !to) return [];
  // A relative date is a preset, written without the range separator.
  const value = from.startsWith('-') && !to ? from : `${from}/${to}`;
  return [{ prefix, value }];
}

function savedSearchHref(searchPath: string, sp: SavedSearchParameters = {}) {
  const filters = tokensToSearchQuery([
    ...(sp.fulltext ? [{ prefix: 'fulltext', value: 'true' }] : []),
    ...dateToken('publisert', sp.publisertDatoFrom, sp.publisertDatoTo),
    ...dateToken('oppdatert', sp.oppdatertDatoFrom, sp.oppdatertDatoTo),
    ...dateToken('moetedato', sp.moetedatoFrom, sp.moetedatoTo),
    ...(sp.journalposttype?.length
      ? [
          {
            prefix: 'journalposttype',
            value: serializeParamList(
              sp.journalposttype.map(toJournalposttypeShorthand),
            ),
          },
        ]
      : []),
  ]);

  const params = new URLSearchParams();
  const query = [sp.query, filters].filter(Boolean).join(' ');
  if (query) params.set('q', query);
  if (sp.administrativEnhet?.length) {
    params.set('enhet', serializeParamList(sp.administrativEnhet));
  }
  for (const entity of sp.entity ?? []) {
    params.append('entity', entity);
  }

  const queryString = params.toString();
  return queryString ? `${searchPath}?${queryString}` : searchPath;
}

export default function SavedSearchesList({
  initialPage,
  searchPath,
}: {
  initialPage: PaginatedList<LagretSoek>;
  searchPath: string;
}) {
  const t = useTranslation();
  const [page, setPage] = useState(initialPage);
  // A page request started before a delete finished still contains the
  // deleted item, so it is filtered out again when the page arrives.
  const deletedIds = useRef(new Set<string>());

  const handleScrollTrigger = useCallback(async () => {
    const next = await fetchNextPage(page);
    setPage({
      ...next,
      items: next.items.filter((item) => !deletedIds.current.has(item.id)),
    });
  }, [page]);

  const handleDelete = useCallback((id: string) => {
    deletedIds.current.add(id);
    setPage((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  }, []);

  if (!page.items.length && !page.next) {
    return <Paragraph>{t('bruker.savedSearchesPage.empty')}</Paragraph>;
  }

  return (
    <>
      <ul className={styles.list}>
        {page.items.map((savedSearch) => (
          <SavedSearchItem
            key={savedSearch.id}
            savedSearch={savedSearch}
            href={savedSearchHref(searchPath, savedSearch.searchParameters)}
            onDelete={handleDelete}
          />
        ))}
      </ul>
      {page.next && (
        <EinScrollTrigger onEnter={handleScrollTrigger}>
          <SavedSearchesListSkeleton />
        </EinScrollTrigger>
      )}
    </>
  );
}
