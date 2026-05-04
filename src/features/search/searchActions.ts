'use server';

import {
  type Base,
  EInnsynError,
  type FilterParameters,
  type PaginatedList,
  type SearchParameters,
} from '@digdir/einnsyn-sdk';
import { cachedApiClient } from '~/actions/api/getApiClient';
import { logger } from '~/lib/utils/logger';
import {
  searchQueryToTokens,
  tokensToSearchQuery,
} from '~/lib/utils/searchStringTokenizer';

type Journalposttype = FilterParameters['journalposttype'];

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

/** Build a SearchParameters object based on an enhetSlug and URLSearchParams.
 *
 * @param enhetSlug
 * @param urlSearchParams
 * @returns
 */
export const buildSearchParameters = async (
  enhetSlug: string,
  urlSearchParams: URLSearchParams | string,
): Promise<SearchParameters> => {
  const searchParameters: SearchParameters = {};
  const resolvedSearchParams =
    typeof urlSearchParams === 'string'
      ? new URLSearchParams(urlSearchParams)
      : urlSearchParams;

  // Combine Entity filter from path and searchParams
  if (resolvedSearchParams.has('entity')) {
    searchParameters.entity = resolvedSearchParams
      .getAll('entity')
      .filter(isSearchableEntity);
  }

  // Combine Enhet filter from path and searchParams
  const enhet: string[] = [];
  if (enhetSlug) {
    enhet.push(enhetSlug);
  }
  if (resolvedSearchParams.has('enhet')) {
    enhet.push(...(resolvedSearchParams.get('enhet') ?? '').split(','));
  }
  if (enhet.length) {
    searchParameters.administrativEnhet = enhet;
  }

  // Build the query object based on the searchParams
  if (resolvedSearchParams.has('q')) {
    const searchTokens = searchQueryToTokens(
      resolvedSearchParams.get('q') ?? '',
    );

    // Add regular search words (preserving quotes)
    const filteredTokens = searchTokens.filter((token) => !token.prefix);
    searchParameters.query = tokensToSearchQuery(filteredTokens);

    // Fulltext
    const fulltext = searchTokens.some(
      (token) => token.prefix === 'fulltext' && token.value === 'true',
    );
    if (fulltext) {
      searchParameters.fulltext = true;
    }

    // publisertDato
    const publisertDato = searchTokens.find(
      (token) => token.prefix === 'publisert',
    );
    if (publisertDato) {
      const [from, to] = publisertDato.value.split('/');
      if (from) {
        searchParameters.publisertDatoFrom = toISOString(from);
      }
      if (to) {
        searchParameters.publisertDatoTo = toISOString(to, true);
      }
    }

    // oppdatertDato
    const oppdatertDato = searchTokens.find(
      (token) => token.prefix === 'oppdatert',
    );
    if (oppdatertDato) {
      const [from, to] = oppdatertDato.value.split('/');
      if (from) {
        searchParameters.oppdatertDatoFrom = toISOString(from);
      }
      if (to) {
        searchParameters.oppdatertDatoTo = toISOString(to, true);
      }
    }

    // moetedato
    const moetedato = searchTokens.find(
      (token) => token.prefix === 'moetedato',
    );
    if (moetedato) {
      const [from, to] = moetedato.value.split('/');
      if (from) {
        searchParameters.moetedatoFrom = toISOString(from);
      }
      if (to) {
        searchParameters.moetedatoTo = toISOString(to, true);
      }
    }

    // journalposttype
    const journalposttype = searchTokens.find(
      (token) => token.prefix === 'journalposttype',
    );
    if (journalposttype) {
      const wantedTypes = journalposttype.value.split(',');
      const queryTypes: Journalposttype = [];
      if (wantedTypes.includes('inngaaende')) {
        queryTypes.push('inngaaende_dokument');
      }
      if (wantedTypes.includes('utgaaende')) {
        queryTypes.push('utgaaende_dokument');
      }
      if (wantedTypes.includes('internt')) {
        queryTypes.push('organinternt_dokument_for_oppfoelging');
        queryTypes.push('organinternt_dokument_uten_oppfoelging');
      }
      if (wantedTypes.includes('saksframlegg')) {
        queryTypes.push('saksframlegg');
      }
      searchParameters.journalposttype = queryTypes;
    }
  }

  return searchParameters;
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

  const searchParameters = await buildSearchParameters(enhetSlug, searchParams);
  logger.debug('Search API query', searchParameters);

  try {
    searchParameters.expand = [
      'administrativEnhetObjekt.parent.parent',
      'saksmappe',
      'dokumentbeskrivelse.dokumentobjekt',
      'korrespondansepart.administrativEnhetObjekt',
    ];
    const searchResults = await api.search.search(searchParameters);
    return searchResults;
  } catch (error) {
    if (error instanceof EInnsynError) {
      logger.error('Error fetching search results', error);
    }
    return getEmptySearchResults();
  }
};

/**
 * Convert a date string to ISO format, handling both absolute and relative date formats.
 *
 * @param date
 * @param endOfDay
 * @returns
 */
const toISOString = (date: string, endOfDay = false): string => {
  // Detect relative dates (-1D, -2W, -3M, -4Y)
  const relativeDateMatch = date.match(/^-(\d+)([hHdDwWmMyY])$/);
  if (relativeDateMatch) {
    const value = parseInt(relativeDateMatch[1], 10);
    const unit = relativeDateMatch[2];
    const now = new Date();
    switch (unit) {
      case 'H':
      case 'h':
        now.setHours(now.getHours() - value);
        break;
      case 'D':
      case 'd':
        now.setDate(now.getDate() - value);
        break;
      case 'W':
      case 'w':
        now.setDate(now.getDate() - value * 7);
        break;
      case 'M':
      case 'm':
        now.setMonth(now.getMonth() - value);
        break;
      case 'Y':
      case 'y':
        now.setFullYear(now.getFullYear() - value);
        break;
    }
    if (endOfDay) {
      now.setUTCHours(23, 59, 59, 999);
    } else {
      now.setUTCHours(0, 0, 0, 0);
    }
    return now.toISOString();
  }

  const d = new Date(date);
  if (Number.isNaN(d.getTime())) {
    // Invalid date, return original string to let the API handle the error.
    return date;
  }

  if (endOfDay && !date.includes('T')) {
    // For a date-only string used as an end date, set to the end of the day in UTC.
    d.setUTCHours(23, 59, 59, 999);
  }

  return d.toISOString();
};
