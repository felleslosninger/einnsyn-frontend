import 'server-only';

import {
  type Base,
  EInnsynError,
  type FilterParameters,
  type PaginatedList,
  type SearchParameters,
} from '@digdir/einnsyn-sdk';
import { cachedApiClient } from '~/lib/api/api.server';
import {
  getEnhetSelection,
  isSearchableEntity,
  isSortOption,
  type SortOption,
} from '~/lib/routing/searchParams';
import { logger } from '~/lib/utils/logger';
import { parseParamList } from '~/lib/utils/paramList';
import {
  searchQueryToTokens,
  tokensToSearchQuery,
} from '~/lib/utils/searchStringTokenizer';

type Journalposttype = FilterParameters['journalposttype'];

const SORT_MAP: Record<
  SortOption,
  { sortBy: SearchParameters['sortBy']; sortOrder: 'asc' | 'desc' } | null
> = {
  score: null,
  publisertDatoDesc: { sortBy: 'publisertDato', sortOrder: 'desc' },
  publisertDatoAsc: { sortBy: 'publisertDato', sortOrder: 'asc' },
  oppdatertDatoDesc: { sortBy: 'oppdatertDato', sortOrder: 'desc' },
  oppdatertDatoAsc: { sortBy: 'oppdatertDato', sortOrder: 'asc' },
  offentligTittelAsc: { sortBy: 'tittel', sortOrder: 'asc' },
  offentligTittelDesc: { sortBy: 'tittel', sortOrder: 'desc' },
  enhetAsc: { sortBy: 'administrativEnhetNavn', sortOrder: 'asc' },
  enhetDesc: { sortBy: 'administrativEnhetNavn', sortOrder: 'desc' },
};

async function getEmptySearchResults(): Promise<PaginatedList<Base>> {
  return {
    items: [],
  };
}

/**
 * Get the search API query for a search
 *
 * @param enhetSlug
 * @param searchParams
 * @returns
 */
export const getSearchParameters = (
  enhetSlug: string | undefined,
  searchParams: URLSearchParams,
): SearchParameters => {
  const apiQuery: SearchParameters = {};

  // Combine Entity filter from path and searchParams
  if (searchParams.has('entity')) {
    apiQuery.entity = searchParams.getAll('entity').filter(isSearchableEntity);
  }

  const enhet = getEnhetSelection(enhetSlug, searchParams);
  if (enhet.length) {
    apiQuery.administrativEnhet = enhet;
  }

  // Build the query object based on the searchParams
  if (searchParams.has('q')) {
    const searchTokens = searchQueryToTokens(searchParams.get('q') ?? '');

    // Add regular search words (preserving quotes)
    const filteredTokens = searchTokens.filter((token) => !token.prefix);
    apiQuery.query = tokensToSearchQuery(filteredTokens);

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
        apiQuery.publisertDatoFrom = toApiDate(from);
      }
      if (to) {
        apiQuery.publisertDatoTo = toApiDate(to, true);
      }
    }

    // oppdatertDato
    const oppdatertDato = searchTokens.find(
      (token) => token.prefix === 'oppdatert',
    );
    if (oppdatertDato) {
      const [from, to] = oppdatertDato.value.split('/');
      if (from) {
        apiQuery.oppdatertDatoFrom = toApiDate(from);
      }
      if (to) {
        apiQuery.oppdatertDatoTo = toApiDate(to, true);
      }
    }

    // moetedato
    const moetedato = searchTokens.find(
      (token) => token.prefix === 'moetedato',
    );
    if (moetedato) {
      const [from, to] = moetedato.value.split('/');
      if (from) {
        apiQuery.moetedatoFrom = toApiDate(from);
      }
      if (to) {
        apiQuery.moetedatoTo = toApiDate(to, true);
      }
    }

    // journalposttype
    const journalposttype = searchTokens.find(
      (token) => token.prefix === 'journalposttype',
    );
    if (journalposttype) {
      const wantedTypes = parseParamList(journalposttype.value);
      const queryTypes: Journalposttype = [];
      if (wantedTypes.includes('inngaaende')) {
        queryTypes.push('inngaaende_dokument');
      }
      if (wantedTypes.includes('utgaaende')) {
        queryTypes.push('utgaaende_dokument');
      }
      if (
        wantedTypes.includes('organinternt') ||
        wantedTypes.includes('internt')
      ) {
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

  return apiQuery;
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
  const apiQuery = getSearchParameters(enhetSlug, searchParams);

  const sortParam = searchParams.get('sort');
  const sortConfig = isSortOption(sortParam) ? SORT_MAP[sortParam] : null;
  if (sortConfig) {
    apiQuery.sortBy = sortConfig.sortBy;
    apiQuery.sortOrder = sortConfig.sortOrder;
  }

  try {
    apiQuery.expand = [
      'administrativEnhetObjekt.parent.parent.parent.parent',
      'utvalgObjekt.parent.parent.parent.parent',
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

const DATE_MATH_UNITS: Record<string, string> = {
  h: 'h',
  d: 'd',
  w: 'w',
  m: 'M',
  y: 'y',
};

/**
 * Convert a relative date (-24h, -7d, -1m, -1y) to date math, so a saved
 * search keeps moving with time. Hours are exact, other units are rounded to
 * whole days. Elasticsearch rounds `/d` up to the end of the day when it is
 * used as an upper bound.
 */
const toDateMath = (date: string): string | undefined => {
  const relativeDateMatch = date.match(/^-(\d+)([hHdDwWmMyY])$/);
  if (!relativeDateMatch) {
    return undefined;
  }
  const unit = DATE_MATH_UNITS[relativeDateMatch[2].toLowerCase()];
  const rounding = unit === 'h' ? '' : '/d';
  return `now-${relativeDateMatch[1]}${unit}${rounding}`;
};

/**
 * Convert a date from the search query to a value the API accepts
 *
 * @param date A relative date (-7d) or an ISO date / date-time
 * @param endOfDay Move a date-only ISO string to the end of the day. Has no
 * effect on relative dates, see toDateMath.
 * @returns
 */
const toApiDate = (date: string, endOfDay = false): string => {
  const dateMath = toDateMath(date);
  if (dateMath) {
    return dateMath;
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
