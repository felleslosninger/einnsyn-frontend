import type { LanguageCode } from '../translation/translation';
import {
  normalizeParamList,
  parseParamList,
  serializeParamList,
} from '../utils/paramList';
import { getPathEnhet, toLocalizedPath } from './pathname';

export const SEARCHABLE_ENTITIES = [
  'Journalpost',
  'Saksmappe',
  'Moetemappe',
  'Moetesak',
] as const;
export type SearchableEntity = (typeof SEARCHABLE_ENTITIES)[number];

export const isSearchableEntity = (value: unknown): value is SearchableEntity =>
  SEARCHABLE_ENTITIES.includes(value as SearchableEntity);

export const SORT_OPTIONS = [
  'score',
  'publisertDatoDesc',
  'publisertDatoAsc',
  'oppdatertDatoDesc',
  'oppdatertDatoAsc',
  'offentligTittelAsc',
  'offentligTittelDesc',
  'enhetAsc',
  'enhetDesc',
] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];
export const DEFAULT_SORT = 'score';

export const isSortOption = (value: unknown): value is SortOption =>
  SORT_OPTIONS.includes(value as SortOption);

/** The search URL's query params. Filters live as tokens inside `q`. */
export type SearchParams = {
  q: string;
  entity: SearchableEntity;
  sort: SortOption;
  /** Serialized with `serializeParamList` in the URL. */
  enhet: readonly string[];
};

// A param at its default is left out of the URL, so each search has one href.
const SEARCH_PARAM_DEFAULTS: Partial<Record<keyof SearchParams, string>> = {
  sort: DEFAULT_SORT,
};

// The first value, every value, or every value as one comma-separated list.
type ParamRead = 'first' | 'all' | 'list';

// The search's params in URL order, read as `getSearchParameters` reads them.
const SEARCH_PARAM_READS: Record<keyof SearchParams, ParamRead> = {
  q: 'first',
  entity: 'all',
  sort: 'first',
  enhet: 'list',
};

/**
 * The query string for a search, like `location.search`: `?…`, or `''`.
 *
 * Keeps only the search's params, read as the search reads them, with
 * `updates` applied, in a fixed order and without empty or default values, so
 * each search has one href. An update of `undefined`, `''` or `[]` removes the
 * param.
 */
export function buildQueryString({
  searchParams,
  updates = {},
}: {
  searchParams: URLSearchParams | undefined;
  updates?: Partial<SearchParams>;
}): string {
  const nextSearchParams = new URLSearchParams();

  for (const key of Object.keys(SEARCH_PARAM_READS) as (keyof SearchParams)[]) {
    const read = SEARCH_PARAM_READS[key];
    let values: (string | null | undefined)[];
    if (key in updates) {
      const update = updates[key];

      // Keep the incoming updated value
      if (typeof update === 'string') {
        values = [update];
      } else if (Array.isArray(update)) {
        values = [serializeParamList(update)];
      } else {
        values = [];
      }
    }
    // Keep the first value of a list
    else if (read === 'first') {
      values = [searchParams?.get(key)];
    }
    // Keep every value of a list
    else if (read === 'list') {
      const list = searchParams?.getAll(key) ?? [];
      values = [
        serializeParamList(list.flatMap((value) => parseParamList(value))),
      ];
    }
    // Keep every value as-is
    else {
      values = searchParams?.getAll(key) ?? [];
    }

    for (const value of values) {
      if (value && value !== SEARCH_PARAM_DEFAULTS[key]) {
        nextSearchParams.append(key, value);
      }
    }
  }

  const queryString = nextSearchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * The enhet selection a URL encodes: the path enhet (`/oslo`), then every
 * `enhet` param value. The inverse of {@link buildSearchHref}.
 */
export function getEnhetSelection(
  pathEnhet: string | undefined,
  searchParams: URLSearchParams,
): string[] {
  return normalizeParamList([
    ...(pathEnhet ? [pathEnhet] : []),
    ...searchParams.getAll('enhet').flatMap((value) => parseParamList(value)),
  ]);
}

/**
 * The href for a search: the current search with `updates` applied.
 *
 * A single selected Enhet goes in the path (`/oslo`); none or several go to the
 * search page, all in the `enhet` param. So each selection has one URL,
 * wherever the search started. Without an `enhet` update, the selection is
 * read from the current URL (pass `[]` to clear it).
 */
export function buildSearchHref({
  pathname,
  searchParams,
  languageCode,
  updates = {},
}: {
  pathname: string;
  searchParams: URLSearchParams | undefined;
  languageCode: LanguageCode;
  updates?: Partial<SearchParams>;
}): string {
  const { enhet, ...otherUpdates } = updates;
  const enhetSelection =
    enhet !== undefined
      ? normalizeParamList(enhet)
      : getEnhetSelection(
          getPathEnhet(pathname),
          searchParams ?? new URLSearchParams(),
        );
  const pathEnhet = enhetSelection.length === 1 ? enhetSelection[0] : undefined;

  const targetPathname =
    pathEnhet !== undefined
      ? toLocalizedPath(languageCode, '/[enhet]', pathEnhet)
      : toLocalizedPath(languageCode, '/search');
  return `${targetPathname}${buildQueryString({
    searchParams,
    updates: {
      ...otherUpdates,
      enhet: pathEnhet !== undefined ? [] : enhetSelection,
    },
  })}`;
}
