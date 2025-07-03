'use server';

import {
  type Base,
  EInnsynError,
  type PaginatedList,
  type SearchParameters,
} from '@digdir/einnsyn-sdk';
import { cachedApiClient } from './getApiClient';
import { logger } from '~/lib/utils/logger';

export async function getEmptySearchResults(): Promise<PaginatedList<Base>> {
  return {
    items: [],
  };
}

type SearchableEntity = 'Journalpost' | 'Saksmappe' | 'Moetemappe' | 'Moetesak';
const isSearchableEntity = (
  entityName?: string | null,
): entityName is SearchableEntity => {
  return (
    entityName !== undefined &&
    entityName != null &&
    (entityName === 'Journalpost' ||
      entityName === 'Saksmappe' ||
      entityName === 'Moetemappe' ||
      entityName === 'Moetesak')
  );
};

/**
 * Get a PaginatedList of search results
 *
 * @param api
 * @param searchParams
 * @returns
 */
export const getSearchResults = async (
  enhetSlug: string,
  searchParams: URLSearchParams,
) => {
  const api = await cachedApiClient();
  const apiQuery: SearchParameters = {};

  // Combine Entity filter from path and searchParams
  if (searchParams.has('entity')) {
    apiQuery.entity = searchParams.getAll('entity').filter(isSearchableEntity);
  }

  // Combine Enhet filter from path and searchParams
  const enhet: string[] = [];
  if (enhetSlug) {
    enhet.push(enhetSlug);
  }
  if (searchParams.has('enhet')) {
    enhet.push(...(searchParams.getAll('enhet') ?? ''));
  }
  if (enhet.length) {
    apiQuery.administrativEnhet = enhet;
  }

  // Build the query object based on the searchParams
  if (searchParams.has('q')) {
    apiQuery.query = searchParams.get('q') ?? '';
  }

  try {
    apiQuery.expand = [
      'administrativEnhetObjekt.parent.parent',
      'saksmappe',
      'dokumentbeskrivelse.dokumentobjekt',
      'korrespondansepart.administrativEnhetObjekt',
    ];
    const searchResults = await api.search.search(apiQuery);
    return searchResults;
  } catch (error) {
    // TODO: Handle the error
    if (error instanceof EInnsynError) {
      logger.error('Error fetching search results', error);
    }
    return getEmptySearchResults();
  }
};
