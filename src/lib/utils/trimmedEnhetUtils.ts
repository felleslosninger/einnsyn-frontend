import type { Enhet } from '@digdir/einnsyn-sdk';
import type { LanguageCode } from '~/lib/translation/translation';
import { getName } from './enhetUtils';

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

export type TrimmedEnhetParent = string | TrimmedEnhet;

export type TrimmedEnhet = TrimmedEnhetBase & {
  parent?: TrimmedEnhetParent;
};

export function getTrimmedEnhetParentId(
  enhet: Pick<TrimmedEnhet, 'parent'>,
): string | undefined {
  if (typeof enhet.parent === 'string') {
    return enhet.parent;
  }
  return enhet.parent?.id;
}

export function getRawTrimmedEnhetParent(
  enhet: TrimmedEnhet,
  enhetsById: ReadonlyMap<string, TrimmedEnhet>,
): TrimmedEnhet | undefined {
  const parentId = getTrimmedEnhetParentId(enhet);
  if (!parentId) {
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

    const parent = getRawTrimmedEnhetParent(enhet, enhetsById);
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

    let current = getRawTrimmedEnhetParent(enhet, allEnhetsById);
    while (current?.parent) {
      merged.set(current.id, current);
      current = getRawTrimmedEnhetParent(current, allEnhetsById);
    }
  }

  return Array.from(merged.values());
}
