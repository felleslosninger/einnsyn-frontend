'use server';

import type { Moetemappe, PaginatedList } from '@digdir/einnsyn-sdk';
import { cachedApiClient } from '~/actions/api/getApiClient';
import { logger } from '~/lib/utils/logger';
import { buildSearchParameters } from '../search/searchActions';
import type { DateRange } from './calendarHelpers';

/**
 * Fetch calendar results for a date range and return all pages as a flat list.
 *
 * @param enhetSlug Enhet slug used to scope the search.
 * @param searchParams URL search params used to build shared filters.
 * @param dateRange Inclusive date range for meeting dates.
 * @returns All matching meeting folders.
 */
export const getCalendarResults = async (
  enhetSlug: string,
  searchParams: URLSearchParams,
  dateRange: DateRange,
): Promise<Moetemappe[]> => {
  const api = await cachedApiClient();

  const searchParameters = await buildSearchParameters(enhetSlug, searchParams);

  // Expand utvalgObjekt
  searchParameters.expand = [
    'administrativEnhetObjekt.parent.parent',
    'utvalgObjekt.parent.parent',
  ];

  // We only need Moetemappe
  searchParameters.entity = ['Moetemappe'];

  // Limit by date range
  searchParameters.moetedatoFrom = dateRange.from;
  searchParameters.moetedatoTo = dateRange.to;

  // Order by moetedato
  searchParameters.sortBy = 'moetedato';
  searchParameters.sortOrder = 'asc';

  // Max limit (we'll fetch all results by paginating)
  searchParameters.limit = 100;

  logger.debug('Search API query', searchParameters);

  try {
    const searchResults = (await api.search.search(
      searchParameters,
    )) as PaginatedList<Moetemappe>;

    // Iterate over paginated results to fetch all pages
    const results: Moetemappe[] = [];
    for await (const item of api.iterate(searchResults)) {
      results.push(item);
    }

    return results;
  } catch (error) {
    logger.error('Error fetching calendar results', {
      error: error instanceof Error ? error.message : String(error),
      searchParameters,
    });
    return [] as Moetemappe[];
  }
};
