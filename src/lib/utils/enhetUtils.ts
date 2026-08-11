import type { Enhet } from '@digdir/einnsyn-sdk';
import type { LanguageCode } from '../translation/translation';

export type NamedEnhet = Pick<
  Enhet,
  'navn' | 'navnNynorsk' | 'navnEngelsk' | 'navnSami'
>;

interface AncestorNode extends NamedEnhet {
  parent?: string | AncestorNode;
}

type TrimmedEnhetBase = Pick<
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

export type TrimmedEnhetParent = string | TrimmedEnhet;

export type TrimmedEnhet = TrimmedEnhetBase & {
  parent?: TrimmedEnhetParent;
};

/**
 * The enhet's name in the given language, falling back to bokmål `navn`.
 *
 * Only `navn` is guaranteed by the API; the nynorsk, sami and english names are
 * optional, so a missing translation shows the bokmål name rather than nothing.
 */
export const getName = (
  enhet: NamedEnhet | string,
  languageCode: LanguageCode,
): string => {
  if (typeof enhet === 'string') {
    return enhet; // This is most likely an ID that we can't resolve (yet)
  }
  if (languageCode === 'nb') {
    return enhet.navn;
  }
  if (languageCode === 'nn') {
    return enhet.navnNynorsk ?? enhet.navn;
  }
  if (languageCode === 'se') {
    return enhet.navnSami ?? enhet.navn;
  }
  return enhet.navnEngelsk ?? enhet.navn;
};

/**
 * How an enhet is identified in URLs: its readable slug, or the id when it has
 * none.
 *
 * Used for the `enhet` search param and as a cache key, so any map keyed on it
 * has to accept a plain id as well.
 *
 * Not interchangeable with `enhet.id` at the API boundary: the cursor params
 * (`startingAfter`/`endingBefore`) silently misbehave when given a slug. Pass
 * `enhet.id` there, never this. For a link target, use {@link getEnhetHref}.
 */
export const getEnhetIdentifier = (enhet: Pick<Enhet, 'id' | 'slug'>) => {
  return enhet.slug ?? enhet.id;
};

/**
 * The absolute path to an enhet's page, e.g. `"/oslo-kommune"`.
 *
 * Has to stay absolute and encoded: `EinLink` passes its `href` straight to the
 * `<a>`, where a relative value resolves against the current document.
 */
export const getEnhetHref = (enhet: string | Pick<Enhet, 'id' | 'slug'>) => {
  const identifier =
    typeof enhet === 'string' ? enhet : getEnhetIdentifier(enhet);
  return `/${encodeURIComponent(identifier)}`;
};

/**
 * The enhet's ancestors, ordered outermost first, for breadcrumb-style paths.
 *
 * The enhet itself is not included, and neither is the top-level node: the
 * walk stops at the first ancestor without a parent, since that root is the
 * container every enhet lives under and adds nothing to a path. Ancestors that
 * the API returned as bare id strings instead of expanded objects also end the
 * walk, so an unexpanded chain yields fewer (or no) ancestors.
 */
export const getAncestors = <T extends AncestorNode>(enhet: T): T[] => {
  const ancestors: T[] = [];
  let current: string | AncestorNode | undefined = enhet.parent;
  while (typeof current === 'object' && current?.parent) {
    ancestors.unshift(current as T);
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
  enhet: AncestorNode,
  separator = ' / ',
  languageCode: LanguageCode = 'en',
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
export function getEnhetParentFromMap(
  enhet: TrimmedEnhet,
  enhetsById: ReadonlyMap<string, TrimmedEnhet>,
): TrimmedEnhet | undefined {
  const parentId =
    typeof enhet.parent === 'string' ? enhet.parent : enhet.parent?.id;
  if (!parentId) {
    return undefined;
  }
  return enhetsById.get(parentId);
}

/**
 * Order enhets for the enhet selector, most prominent first.
 *
 * The top-level root is dropped (enhets without a parent), since it is not
 * selectable. The rest are ordered by real enhets before `DUMMYENHET` grouping
 * nodes, then by depth so top-level organisations come before their
 * sub-units, then by name in the active language with Norwegian collation.
 * Those three rules mirror `enhetSearch.sortNodes`, which orders the same list
 * on the client once the full enhet list has loaded.
 *
 * Callers use `.slice(0, n)` on the result to get the default suggestions.
 */
export function sortTrimmedEnhetsForSelector(
  enhets: readonly TrimmedEnhet[],
  languageCode: LanguageCode,
): TrimmedEnhet[] {
  const candidates = enhets.filter((enhet) => !!enhet.parent);
  const enhetsById = new Map<string, TrimmedEnhet>();
  for (const enhet of candidates) {
    enhetsById.set(enhet.id, enhet);
  }

  const depthCache = new Map<string, number>();
  const getDepth = (enhet: TrimmedEnhet): number => {
    const cachedDepth = depthCache.get(enhet.id);
    if (cachedDepth !== undefined) {
      return cachedDepth;
    }

    const parent = getEnhetParentFromMap(enhet, enhetsById);
    const depth = parent ? 1 + getDepth(parent) : 0;
    depthCache.set(enhet.id, depth);
    return depth;
  };

  const scoreOf = (enhet: TrimmedEnhet) =>
    enhet.enhetstype === 'DUMMYENHET' ? 0.5 : 1;

  return [...candidates].sort((a, b) => {
    const scoreDiff = scoreOf(b) - scoreOf(a);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    const depthDiff = getDepth(a) - getDepth(b);
    if (depthDiff !== 0) {
      return depthDiff;
    }

    return getName(a, languageCode).localeCompare(
      getName(b, languageCode),
      'no',
    );
  });
}

/**
 * The seed enhets plus every ancestor of theirs found in `allEnhets`, deduped.
 *
 * The selector renders a tree, so a selected sub-unit is only reachable if its
 * whole parent chain is present. This adds the missing links to a partial list
 * (typically the top suggestions plus whatever the URL selected). As in
 * {@link getAncestors}, the top-level root is left out. Order is
 * insertion-ordered, not sorted.
 */
export function expandTrimmedEnhetsWithAncestors(
  seeds: readonly TrimmedEnhet[],
  allEnhets: readonly TrimmedEnhet[],
): TrimmedEnhet[] {
  const allEnhetsById = new Map<string, TrimmedEnhet>();
  for (const enhet of allEnhets) {
    allEnhetsById.set(enhet.id, enhet);
  }

  const merged = new Map<string, TrimmedEnhet>();
  for (const enhet of seeds) {
    merged.set(enhet.id, enhet);

    let current = getEnhetParentFromMap(enhet, allEnhetsById);
    while (current?.parent) {
      merged.set(current.id, current);
      current = getEnhetParentFromMap(current, allEnhetsById);
    }
  }

  return Array.from(merged.values());
}
