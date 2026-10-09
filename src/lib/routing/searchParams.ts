import type { LanguageCode } from '../translation/translation';
import {
  normalizeParamList,
  parseParamList,
  serializeParamList,
} from '../utils/paramList';
import { buildPathname, getPathEnhet } from './pathname';

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

/**
 * The query string for `searchParams` with `updates` applied, like
 * `location.search`: `?…`, or `''` when no params remain, so it can be appended
 * to a pathname as is.
 *
 * `undefined`, empty-string values and values equal to the default delete the param.
 *
 * `searchParams` is nullable because `useOptimisticSearchParams` is typed that
 * way; `undefined` counts as empty.
 */
export function buildQueryString({
  searchParams,
  updates,
}: {
  searchParams: URLSearchParams | undefined;
  updates?: Partial<SearchParams>;
}): string {
  const nextSearchParams = new URLSearchParams(searchParams?.toString());

  for (const [key, update] of Object.entries(updates ?? {})) {
    const value =
      typeof update === 'string'
        ? update
        : update && serializeParamList(update);
    if (value) {
      nextSearchParams.set(key, value);
    } else {
      nextSearchParams.delete(key);
    }
  }

  for (const [key, defaultValue] of Object.entries(SEARCH_PARAM_DEFAULTS)) {
    if (nextSearchParams.get(key) === defaultValue) {
      nextSearchParams.delete(key);
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
  const selection =
    enhet !== undefined
      ? normalizeParamList(enhet)
      : getEnhetSelection(
          getPathEnhet(pathname),
          searchParams ?? new URLSearchParams(),
        );
  const pathEnhet = selection.length === 1 ? selection[0] : undefined;

  const targetPathname = buildPathname(
    pathEnhet !== undefined
      ? { enhetIdentifier: pathEnhet }
      : { page: 'search' },
    languageCode,
  );
  return `${targetPathname}${buildQueryString({
    searchParams,
    updates: {
      ...otherUpdates,
      enhet: pathEnhet !== undefined ? [] : selection,
    },
  })}`;
}
