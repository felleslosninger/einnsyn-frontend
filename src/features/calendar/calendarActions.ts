'use server';

import type {
  Moetemappe,
  PaginatedList,
  SearchParameters,
} from '@digdir/einnsyn-sdk';
import { cachedApiClient } from '~/actions/api/getApiClient';
import { logger } from '~/lib/utils/logger';
import type { DateRange } from './calendarHelpers';

export type CalendarPage = {
  items: Moetemappe[];
  next: string | null;
};

export const fetchCalendarPage = async (
  enhetSlug: string,
  dateRange: DateRange,
  cursor?: string,
): Promise<CalendarPage> => {
  const api = await cachedApiClient();

  try {
    let page: PaginatedList<Moetemappe>;

    if (cursor) {
      const result = await api.fetchNextPage<Moetemappe>(cursor);
      page = result ?? { items: [] };
    } else {
      const query: SearchParameters = {
        entity: ['Moetemappe'],
        expand: ['utvalgObjekt.parent'],
        moetedatoFrom: dateRange.from,
        moetedatoTo: dateRange.to,
        sortBy: 'moetedato',
        sortOrder: 'asc',
        limit: 100,
      };
      if (enhetSlug) {
        query.administrativEnhet = [enhetSlug];
      }
      page = (await api.search.search(query)) as PaginatedList<Moetemappe>;
    }

    return { items: page.items ?? [], next: page.next ?? null };
  } catch (error) {
    logger.error('Failed to fetch calendar page', { error, dateRange, cursor });
    return { items: [], next: null };
  }
};
