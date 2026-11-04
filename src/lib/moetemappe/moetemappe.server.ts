import 'server-only';

import { isEnhet, isMoetemappe, type Moetemappe } from '@digdir/einnsyn-sdk';
import { getPublicApiClient } from '~/lib/api/api.server';
import { type TrimmedEnhet, toTrimmedEnhet } from '~/lib/enhet/enhet';
import { getNorwegianDate } from '~/lib/utils/dateFormat';
import { createPromiseCache } from '~/lib/utils/promiseCache';

const UPCOMING_MEETING_COUNT = 5;

export const UPCOMING_MEETINGS_TTL_MS = 60 * 60 * 1000;

export type UpcomingMeeting = Pick<
  Moetemappe,
  'id' | 'offentligTittel' | 'moetedato' | 'moetested'
> & {
  /** The enhet holding the meeting, unless the API left it out. */
  utvalg?: TrimmedEnhet;
};

async function queryUpcomingMeetings(
  enhetId: string,
  from: string,
  limit = UPCOMING_MEETING_COUNT,
): Promise<UpcomingMeeting[]> {
  // Anonymous, since the cache shares the result between users.
  const api = await getPublicApiClient();
  const page = await api.search.search({
    entity: ['Moetemappe'],
    administrativEnhet: [enhetId],
    moetedatoFrom: from,
    sortBy: 'moetedato',
    sortOrder: 'asc',
    limit,
    expand: ['utvalgObjekt'],
  });
  return page.items
    .filter(isMoetemappe)
    .map(({ id, offentligTittel, moetedato, moetested, utvalgObjekt }) => ({
      id,
      offentligTittel,
      moetedato,
      moetested,
      utvalg: isEnhet(utvalgObjekt) ? toTrimmedEnhet(utvalgObjekt) : undefined,
    }));
}

/**
 * Per-enhet meetings, held for {@link UPCOMING_MEETINGS_TTL_MS} within a day
 * and shared by concurrent callers. A factory only so tests can pass a fake
 * fetch and clock.
 */
export function createUpcomingMeetingsCache(
  fetchMeetings = queryUpcomingMeetings,
  now: () => number = Date.now,
) {
  const fetchMeetingsCache = createPromiseCache<UpcomingMeeting[]>(
    UPCOMING_MEETINGS_TTL_MS,
    now,
  );

  return (enhetId: string): Promise<UpcomingMeeting[]> => {
    // The API reads a date as midnight UTC, an hour or two into the Norwegian
    // day, when no meetings are held.
    const today = getNorwegianDate(now());
    return fetchMeetingsCache(enhetId, today, () =>
      fetchMeetings(enhetId, today),
    );
  };
}

/**
 * The next meetings in an enhet and its underenheter, the day's earlier ones
 * included. Takes an id, not a slug.
 */
export const getUpcomingMeetings = createUpcomingMeetingsCache();
