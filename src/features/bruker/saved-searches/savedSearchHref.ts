import type { SavedSearchParameters } from '@digdir/einnsyn-sdk';
import { toJournalposttypeShorthand } from '~/lib/routing/journalposttype';
import { serializeParamList } from '~/lib/utils/paramList';
import { tokensToSearchQuery } from '~/lib/utils/searchStringTokenizer';

// Date math units the search field writes differently: month is `M` in date
// math but `m` in the search field.
const DATE_MATH_UNITS: Record<string, string> = {
  M: 'm',
  h: 'h',
  d: 'd',
  w: 'w',
  y: 'y',
};

/**
 * A saved date as the search field writes it: relative date math
 * (`now-7d/d`) back to `-7d`, and a timestamp back to its date.
 */
function toSearchFieldDate(value: unknown): string {
  if (typeof value !== 'string') return '';
  const relative = value.match(/^now-(\d+)([Mhdwy])(?:\/d)?$/);
  if (relative) return `-${relative[1]}${DATE_MATH_UNITS[relative[2]]}`;
  return value.slice(0, 10);
}

function dateToken(prefix: string, fromValue: unknown, toValue: unknown) {
  const from = toSearchFieldDate(fromValue);
  const to = toSearchFieldDate(toValue);
  if (!from && !to) return [];
  // A relative date is a preset, written without the range separator.
  const value = from.startsWith('-') && !to ? from : `${from}/${to}`;
  return [{ prefix, value }];
}

/**
 * The search page URL that runs a saved search again.
 */
export function savedSearchHref(
  searchPath: string,
  sp: SavedSearchParameters = {},
) {
  const filters = tokensToSearchQuery([
    ...(sp.fulltext ? [{ prefix: 'fulltext', value: 'true' }] : []),
    ...dateToken('publisert', sp.publisertDatoFrom, sp.publisertDatoTo),
    ...dateToken('oppdatert', sp.oppdatertDatoFrom, sp.oppdatertDatoTo),
    ...dateToken('moetedato', sp.moetedatoFrom, sp.moetedatoTo),
    ...(sp.journalposttype?.length
      ? [
          {
            prefix: 'journalposttype',
            value: serializeParamList(
              sp.journalposttype.map(toJournalposttypeShorthand),
            ),
          },
        ]
      : []),
  ]);

  const params = new URLSearchParams();
  const query = [sp.query, filters].filter(Boolean).join(' ');
  if (query) params.set('q', query);
  if (sp.administrativEnhet?.length) {
    params.set('enhet', serializeParamList(sp.administrativEnhet));
  }
  for (const entity of sp.entity ?? []) {
    params.append('entity', entity);
  }

  const queryString = params.toString();
  return queryString ? `${searchPath}?${queryString}` : searchPath;
}
