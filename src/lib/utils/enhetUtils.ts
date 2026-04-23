import type { Enhet } from '@digdir/einnsyn-sdk';
import { useMemo } from 'react';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import type { LanguageCode } from '../translation/translation';

type NamedEnhet = Pick<
  Enhet,
  'navn' | 'navnNynorsk' | 'navnEngelsk' | 'navnSami'
>;

interface AncestorNode extends NamedEnhet {
  parent?: string | AncestorNode;
}

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

export const useName = (enhet: NamedEnhet): string => {
  const languageCode = useLanguageCode();
  return useMemo(() => getName(enhet, languageCode), [enhet, languageCode]);
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

export const useAncestorsAsString = (
  enhet: AncestorNode,
  separator = ' / ',
): string => {
  const languageCode = useLanguageCode();
  return useMemo(
    () => getAncestorsAsString(enhet, separator, languageCode),
    [enhet, separator, languageCode],
  );
};
