import 'server-only';

import {
  EInnsynError,
  type Journalpost,
  type PaginatedList,
  type SearchParameters,
} from '@digdir/einnsyn-sdk';
import { cache } from 'react';
import { cachedApiClient } from '~/lib/api/api.server';

// Everything the open journalpost needs, so a row can open without a fetch.
export const LIST_EXPAND = [
  'skjerming',
  'korrespondansepart',
  'dokumentbeskrivelse.dokumentobjekt',
];
const DETAIL_EXPAND = [
  'administrativEnhetObjekt',
  'saksmappe',
  'dokumentbeskrivelse.dokumentobjekt',
  'korrespondansepart',
  'skjerming',
];

// Resolve a single journalpost with its full detail expand. Wrapped in
// `cache` so the layout's window fetch and the detail page share one request
// when both run in the same server render (a deep link).
const fetchJournalpostDetail = cache(
  async (journalpostId: string): Promise<Journalpost> => {
    const apiClient = await cachedApiClient();
    return apiClient.journalpost.get(journalpostId, { expand: DETAIL_EXPAND });
  },
);

export async function getJournalpost(
  journalpostId: string,
): Promise<Journalpost> {
  return fetchJournalpostDetail(journalpostId);
}

// A saksmappe's journalposts via /search, the only endpoint that sorts by a
// property (the saksmappe's own list sorts by id).
async function searchJournalposts(
  saksmappeId: string,
  parameters: SearchParameters,
): Promise<PaginatedList<Journalpost>> {
  const apiClient = await cachedApiClient();
  const page = await apiClient.search.search({
    saksmappe: [saksmappeId],
    entity: ['Journalpost'],
    sortBy: 'journalpostnummer',
    sortOrder: 'desc',
    expand: LIST_EXPAND,
    ...parameters,
  });
  return page as PaginatedList<Journalpost>;
}

// Initial server-side window: the first page, or for a deep link to a specific
// journalpost a page of items on each side of `active`, with `active` in the
// middle. The client scrolls the (independently scrollable) list to `active` on
// mount, so it lands at the top of the list with the earlier items preloaded
// just above it (ready for the detail pane's "previous" navigation and for
// scrolling up), and either edge extends as the user scrolls.
export async function getJournalpostWindow(
  saksmappeId: string,
  journalpostId: string | undefined,
  pageSize = 25,
): Promise<PaginatedList<Journalpost>> {
  // The cursor needs the active journalpost's sort value and canonical id (the
  // URL param can be a slug), so fetch it first. Use the detail expand, so the
  // detail page can reuse the request-cached result.
  const active = journalpostId
    ? await fetchJournalpostDetail(journalpostId).catch((error: unknown) => {
        // One that fails to load leaves the list valid. Only API errors:
        // Next's control-flow errors must propagate.
        if (error instanceof EInnsynError) return undefined;
        throw error;
      })
    : undefined;

  if (!active) {
    return searchJournalposts(saksmappeId, { limit: pageSize });
  }

  // A /search cursor is [sort value, id].
  const cursor = [String(active.journalpostnummer), active.id];
  const [before, after] = await Promise.all([
    searchJournalposts(saksmappeId, { endingBefore: cursor, limit: pageSize }),
    searchJournalposts(saksmappeId, { startingAfter: cursor, limit: pageSize }),
  ]);

  return {
    items: [...before.items, active, ...after.items],
    previous: before.previous,
    next: after.next,
  };
}
