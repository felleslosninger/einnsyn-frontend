'use server';

import type {
  Moetemappe,
  PaginatedList,
  SearchParameters,
} from '@digdir/einnsyn-sdk';
import { cachedApiClient } from '~/actions/api/getApiClient';
import { logger } from '~/lib/utils/logger';
import type { DateRange } from './calendarHelpers';

export const getCalendarResults = async (
  enhetSlug: string,
  dateRange: DateRange,
): Promise<Moetemappe[]> => {
  const api = await cachedApiClient();

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

  try {
    const firstPage = (await api.search.search(
      query,
    )) as PaginatedList<Moetemappe>;
    const results: Moetemappe[] = [];
    for await (const item of api.iterate(firstPage)) {
      results.push(item);
    }
    return results;
  } catch (error) {
    logger.error('Failed to fetch calendar results', { error, query });
    return [];
  }
};
