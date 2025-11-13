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
import { searchQueryToTokens } from '~/lib/utils/searchStringTokenizer';

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

/**
 * Get a PaginatedList of search results
 *
 * @param enhetSlug
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
    enhet.push(...(enhetSlug.split('-') ?? ''));
  }
  if (searchParams.has('enhet')) {
    enhet.push(...(searchParams.getAll('enhet') ?? ''));
  }
  if (enhet.length) {
    apiQuery.administrativEnhet = enhet;
  }

  // Build the query object based on the searchParams
  if (searchParams.has('q')) {
    const searchTokens = searchQueryToTokens(searchParams.get('q') ?? '');

    // Add regular search words
    const query = searchTokens
      .filter((token) => !token.prefix)
      .map((token) => token.value)
      .join(' ');
    apiQuery.query = query;

    // Fulltext
    const fulltext = searchTokens.some(
      (token) => token.prefix === 'fulltext' && token.value === 'true',
    );
    if (fulltext) {
      apiQuery.fulltext = true;
    }

    // publisertDato
    const publisertDato = searchTokens.find(
      (token) => token.prefix === 'publisert',
    );
    if (publisertDato) {
      const [from, to] = publisertDato.value.split('/');
      if (from) {
        apiQuery.publisertDatoFrom = toISOString(from);
      }
      if (to) {
        apiQuery.publisertDatoTo = toISOString(to, true);
      }
    }

    // oppdatertDato
    const oppdatertDato = searchTokens.find(
      (token) => token.prefix === 'oppdatert',
    );
    if (oppdatertDato) {
      const [from, to] = oppdatertDato.value.split('/');
      if (from) {
        apiQuery.oppdatertDatoFrom = toISOString(from);
      }
      if (to) {
        apiQuery.oppdatertDatoTo = toISOString(to, true);
      }
    }

    // moetedato
    const moetedato = searchTokens.find(
      (token) => token.prefix === 'moetedato',
    );
    if (moetedato) {
      const [from, to] = moetedato.value.split('/');
      if (from) {
        apiQuery.moetedatoFrom = toISOString(from);
      }
      if (to) {
        apiQuery.moetedatoTo = toISOString(to, true);
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
      apiQuery.journalposttype = queryTypes;
    }

    logger.debug('Search API query', apiQuery);
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
