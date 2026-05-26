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
  | 'entity'
  | 'id'
  | 'slug'
  | 'orgnummer'
  | 'navn'
  | 'navnNynorsk'
  | 'navnEngelsk'
  | 'navnSami'
  | 'enhetstype'
>;

export type TrimmedEnhetParent = string;

export type TrimmedEnhet = TrimmedEnhetBase & {
  parent?: TrimmedEnhetParent;
};

export const getName = (
  enhet: NamedEnhet,
  languageCode: LanguageCode,
): string => {
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

export const getEnhetHref = (enhet: Pick<Enhet, 'id' | 'slug'>) => {
  return enhet.slug ?? enhet.id;
};

export const getAncestors = <T extends AncestorNode>(enhet: T): T[] => {
  const ancestors: T[] = [];
  let current: string | AncestorNode | undefined = enhet.parent;
  while (typeof current === 'object' && current?.parent) {
    ancestors.unshift(current as T);
    current = current.parent;
  }
  return ancestors;
};

export const getAncestorsAsString = (
  enhet: AncestorNode,
  separator = ' / ',
  languageCode: LanguageCode = 'en',
) => {
  return getAncestors(enhet)
    .map((ancestor) => getName(ancestor, languageCode))
    .join(separator);
};

// Format a Norwegian org number as 3-3-3 ("921707134" → "921 707 134").
export const formatOrgnummer = (orgnr: string | null | undefined): string => {
  if (!orgnr) return '';
  const digits = orgnr.replace(/\s/g, '');
  if (digits.length === 9) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return orgnr;
};

export function getEnhetParentId(
  enhet: Pick<TrimmedEnhet, 'parent'>,
): string | undefined {
  return enhet.parent;
}

export function getEnhetParentFromMap(
  enhet: TrimmedEnhet,
  enhetsById: ReadonlyMap<string, TrimmedEnhet>,
): TrimmedEnhet | undefined {
  const parentId = getEnhetParentId(enhet);
  if (!parentId) {
    // Root nodes are technical and should not be added
    return undefined;
  }
  return enhetsById.get(parentId);
}

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

export function mergeTrimmedEnhetsWithAncestors(
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
