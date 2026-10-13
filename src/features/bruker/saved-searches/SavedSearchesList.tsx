'use client';

import type {
  LagretSoek,
  PaginatedList,
  SavedSearchParameters,
} from '@digdir/einnsyn-sdk';
import { useCallback, useState } from 'react';
import { EinScrollTrigger } from '~/components/EinScrollTrigger/EinScrollTrigger';
import { toJournalposttypeShorthand } from '~/lib/routing/journalposttype';
import { fetchNextPage } from '~/lib/utils/pagination';
import { serializeParamList } from '~/lib/utils/paramList';
import { tokensToSearchQuery } from '~/lib/utils/searchStringTokenizer';
import styles from './SavedSearches.module.scss';
import { SavedSearchItem } from './SavedSearchItem';
import { SavedSearchItemSkeleton } from './SavedSearchItemSkeleton';

const dateToken = (prefix: string, from: unknown, to: unknown) =>
  from || to ? [{ prefix, value: `${from ?? ''}/${to ?? ''}` }] : [];

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
  const [page, setPage] = useState(initialPage);

  const handleScrollTrigger = useCallback(async () => {
    const next = await fetchNextPage(page);
    setPage(next);
  }, [page]);

  return (
    <>
      <ul className={styles.list}>
        {page.items.map((savedSearch) => (
          <SavedSearchItem
            key={savedSearch.id}
            savedSearch={savedSearch}
            href={savedSearchHref(searchPath, savedSearch.searchParameters)}
          />
        ))}
      </ul>
      {page.next && (
        <EinScrollTrigger onEnter={handleScrollTrigger}>
          <ul className={styles.list}>
            <SavedSearchItemSkeleton index={0} />
            <SavedSearchItemSkeleton index={1} />
            <SavedSearchItemSkeleton index={2} />
          </ul>
        </EinScrollTrigger>
      )}
    </>
  );
}
