import type { Enhet } from '@digdir/einnsyn-sdk';
import type { LanguageCode } from '../translation/translation';

/** An enhet's own fields, without the parent link the tree is built from. */
export type TrimmedEnhetBase = Pick<
  Enhet,
  | 'id'
  | 'slug'
  | 'orgnummer'
  | 'navn'
  | 'navnNynorsk'
  | 'navnEngelsk'
  | 'navnSami'
  | 'enhetstype'
>;

export type TrimmedEnhet = TrimmedEnhetBase & {
  parent?: string | TrimmedEnhet;
};

/**
 * The enhet's name in the given language, falling back to bokmål `navn`.
 *
 * Only `navn` is guaranteed by the API; the nynorsk, sami and english names are
 * optional, so a missing translation shows the bokmål name rather than nothing.
 */
export const getName = (
  enhet: TrimmedEnhetBase,
  languageCode: LanguageCode,
): string => {
  switch (languageCode) {
    case 'nb':
      return enhet.navn;
    case 'nn':
      return enhet.navnNynorsk ?? enhet.navn;
    case 'se':
      return enhet.navnSami ?? enhet.navn;
    case 'en':
      return enhet.navnEngelsk ?? enhet.navn;
  }
};

/**
 * How an enhet is identified in URLs: its readable slug, or the id when it has
 * none. An empty slug counts as none — it would otherwise make `/` a link
 * target and an unmatchable filter value.
 *
 * Used for the `enhet` search param and as a cache key, so any map keyed on it
 * has to accept a plain id as well.
 *
 * Not interchangeable with `enhet.id` at the API boundary: the cursor params
 * (`startingAfter`/`endingBefore`) silently misbehave when given a slug. Pass
 * `enhet.id` there, never this. For a link target, use {@link getEnhetHref}.
 */
export const getEnhetIdentifier = (enhet: Pick<Enhet, 'id' | 'slug'>) => {
  return enhet.slug || enhet.id;
};

/**
 * The absolute path to an enhet's page, e.g. `"/oslo-kommune"`.
 *
 * Has to stay absolute and encoded: `EinLink` passes its `href` straight to the
 * `<a>`, where a relative value resolves against the current document.
 */
export const getEnhetHref = (enhet: Pick<Enhet, 'id' | 'slug'>) => {
  return `/${encodeURIComponent(getEnhetIdentifier(enhet))}`;
};

/**
 * Whether the enhet is addressed by any of `identifiers`, which may mix ids and
 * slugs.
 *
 * The inverse of {@link getEnhetIdentifier}: callers read identifiers out of
 * URLs, where the slug is preferred, but the same value may also arrive as a
 * bare id.
 */
export function matchesEnhetIdentifier(
  enhet: Pick<Enhet, 'id' | 'slug'>,
  identifiers: ReadonlySet<string>,
): boolean {
  return (
    identifiers.has(enhet.id) || (!!enhet.slug && identifiers.has(enhet.slug))
  );
}

/**
 * The enhet's ancestors, ordered outermost first, for breadcrumb-style paths.
 *
 * The enhet itself is not included, and neither is the top-level node: the
 * walk stops at the first ancestor without a parent, since that root is the
 * container every enhet lives under and adds nothing to a path. Ancestors that
 * the API returned as bare id strings instead of expanded objects also end the
 * walk, so an unexpanded chain yields fewer (or no) ancestors.
 */
export const getAncestors = (enhet: TrimmedEnhet): TrimmedEnhet[] => {
  const ancestors: TrimmedEnhet[] = [];
  let current: string | TrimmedEnhet | undefined = enhet.parent;
  while (typeof current === 'object' && current?.parent) {
    if (current.enhetstype !== 'DUMMYENHET') {
      ancestors.unshift(current);
    }
    current = current.parent;
  }
  return ancestors;
};

/**
 * {@link getAncestors} as a single line, e.g. `"Oslo kommune / Byrådet"`.
 *
 * Empty for an enhet directly below the root, so callers that use it as a
 * subtitle typically fall back to `undefined` on an empty string.
 */
export const getAncestorsAsString = (
  enhet: TrimmedEnhet,
  languageCode: LanguageCode,
  separator = ' / ',
) => {
  return getAncestors(enhet)
    .map((ancestor) => getName(ancestor, languageCode))
    .join(separator);
};

/**
 * Look the enhet's parent up in an id-keyed map.
 *
 * `undefined` both for a top-level enhet and when the parent is missing from
 * the map, which is normal for partial lists — callers treat either case as
 * "the chain ends here".
 */
export function getEnhetParentFromMap<T extends TrimmedEnhet>(
  enhet: TrimmedEnhet,
  enhetsById: ReadonlyMap<string, T>,
): T | undefined {
  const parentId =
    typeof enhet.parent === 'string' ? enhet.parent : enhet.parent?.id;
  if (!parentId) {
    return undefined;
  }
  return enhetsById.get(parentId);
}

/**
 * Project a full enhet onto the subset the client needs.
 *
 * The whole list is serialized to the browser when the selector expands, so
 * this stays narrow; `parent` collapses to an id, since the tree is rebuilt
 * from ids via {@link getEnhetParentFromMap}.
 */
export function toTrimmedEnhet(enhet: Enhet): TrimmedEnhet {
  return {
    id: enhet.id,
    slug: enhet.slug,
    navn: enhet.navn,
    navnNynorsk: enhet.navnNynorsk,
    navnEngelsk: enhet.navnEngelsk,
    navnSami: enhet.navnSami,
    orgnummer: enhet.orgnummer,
    enhetstype: enhet.enhetstype,
    parent: typeof enhet.parent === 'string' ? enhet.parent : enhet.parent?.id,
  };
}

/**
 * The seed enhets plus every ancestor of theirs found in `allEnhets`, deduped.
 *
 * The selector renders a tree, so a selected sub-unit is only reachable if its
 * whole parent chain is present. This adds the missing links to a partial list
 * (typically whatever the URL selected). As in {@link getAncestors}, the
 * top-level root is left out. Order is insertion-ordered, not sorted.
 */
export function expandAncestorsInEnhetList<T extends TrimmedEnhet>(
  seeds: readonly T[],
  allEnhets: readonly T[],
): T[] {
  const allEnhetsById = new Map<string, T>();
  for (const enhet of allEnhets) {
    allEnhetsById.set(enhet.id, enhet);
  }

  const merged = new Map<string, T>();
  for (const enhet of seeds) {
    merged.set(enhet.id, enhet);

    // An already-merged ancestor has had its own chain walked, so stopping
    // there both skips the redundant walk and terminates a parent cycle.
    let current = getEnhetParentFromMap(enhet, allEnhetsById);
    while (current?.parent && !merged.has(current.id)) {
      merged.set(current.id, current);
      current = getEnhetParentFromMap(current, allEnhetsById);
    }
  }

  return Array.from(merged.values());
}
