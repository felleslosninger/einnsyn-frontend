import 'server-only';

import {
  EInnsynError,
  type Journalpost,
  type PaginatedList,
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

// Initial server-side window: the newest page, or for a deep link to a specific
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
  const apiClient = await cachedApiClient();

  // The URL param can be a slug; cursor params (endingBefore / startingAfter)
  // only behave correctly with the canonical id. Resolve via .get first.
  // fetchJournalpostDetail is cached per request, so it's better to use
  // detail-expansions than not expanding, so we can re-use the cached result
  // for the active item.
  const active = journalpostId
    ? await fetchJournalpostDetail(journalpostId).catch((error: unknown) => {
        // One that fails to load leaves the list valid. Only API errors:
        // Next's control-flow errors must propagate.
        if (error instanceof EInnsynError) return undefined;
        throw error;
      })
    : undefined;

  if (!active) {
    return apiClient.saksmappe.listJournalpost(saksmappeId, {
      sortOrder: 'desc',
      id: '',
      saksmappeId: '',
      expand: LIST_EXPAND,
    });
  }

  const [before, after] = await Promise.all([
    apiClient.saksmappe.listJournalpost(saksmappeId, {
      sortOrder: 'desc',
      id: '',
      saksmappeId: '',
      endingBefore: active.id,
      limit: pageSize,
      expand: LIST_EXPAND,
    }),
    apiClient.saksmappe.listJournalpost(saksmappeId, {
      sortOrder: 'desc',
      id: '',
      saksmappeId: '',
      startingAfter: active.id,
      limit: pageSize,
      expand: LIST_EXPAND,
    }),
  ]);

  return {
    items: [...before.items, active, ...after.items],
    previous: before.previous,
    next: after.next,
  };
}
