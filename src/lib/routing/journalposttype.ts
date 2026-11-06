import type { FilterParameters } from '@digdir/einnsyn-sdk';

type Journalposttype = NonNullable<FilterParameters['journalposttype']>;

/**
 * The journalposttype groups the search URL exposes, each listing the API
 * values it stands for. A shorthand can cover several API values, so the
 * mapping is not symmetric — which is why both directions read this one list
 * rather than keeping a copy each.
 *
 * Order matters: it decides the order of the API filter and keeps the query
 * stable regardless of how the shorthands were written in the URL.
 */
export const JOURNALPOSTTYPE_GROUPS: ReadonlyArray<{
  shorthand: string;
  apiValues: Journalposttype;
}> = [
  { shorthand: 'inngaaende', apiValues: ['inngaaende_dokument'] },
  { shorthand: 'utgaaende', apiValues: ['utgaaende_dokument'] },
  {
    shorthand: 'organinternt',
    apiValues: [
      'organinternt_dokument_for_oppfoelging',
      'organinternt_dokument_uten_oppfoelging',
    ],
  },
  { shorthand: 'saksframlegg', apiValues: ['saksframlegg'] },
];

/** Spellings accepted in a URL besides the group's own name. */
const SHORTHAND_ALIASES: Record<string, string> = {
  internt: 'organinternt',
};

/** The API values a list of URL shorthands selects. */
export function toApiJournalposttypes(
  shorthands: readonly string[],
): Journalposttype {
  const wanted = new Set(
    shorthands.map((shorthand) => SHORTHAND_ALIASES[shorthand] ?? shorthand),
  );

  return JOURNALPOSTTYPE_GROUPS.filter(({ shorthand }) =>
    wanted.has(shorthand),
  ).flatMap(({ apiValues }) => apiValues);
}

/**
 * The URL shorthand covering an API value.
 *
 * Values no group covers — `sakskart`, `moetebok`, `moeteprotokoll`, `ukjent` —
 * are returned as they are. The search page does not filter on those, so a
 * saved search using one links to a search without that filter applied.
 */
export function toJournalposttypeShorthand(apiValue: string): string {
  const group = JOURNALPOSTTYPE_GROUPS.find(({ apiValues }) =>
    (apiValues as readonly string[]).includes(apiValue),
  );
  return group?.shorthand ?? apiValue;
}
