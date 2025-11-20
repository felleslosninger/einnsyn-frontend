import { type Enhet, isEnhet } from '@digdir/einnsyn-sdk';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import type { LanguageCode } from '../translation/translation';
import { useMemo } from 'react';

export const getAncestors = (enhet: Enhet) => {
  const ancestors: Enhet[] = [];
  let current: Enhet | string | undefined = enhet?.parent;
  while (isEnhet(current) && current.parent) {
    ancestors.unshift(current);
    current = current.parent;
  }
  return ancestors;
};

export const getEnhetHref = (enhet: Enhet) => {
  const ancestors = getAncestors(enhet);
  return ancestors.map((ancestor) => ancestor.id).join('/');
};

export const getAncestorsAsString = (
  enhet: Enhet,
  separator = ' / ',
  languageCode: LanguageCode = 'en',
) => {
  const ancestors = getAncestors(enhet);
  return ancestors
    .map((ancestor) => getName(ancestor, languageCode))
    .join(separator);
};

export const useAncestorsAsString = (
  enhet: Enhet,
  separator = ' / ',
): string => {
  const languageCode = useLanguageCode();
  const ancestorsAsString = useMemo(
    () => getAncestorsAsString(enhet, separator, languageCode),
    [enhet, separator, languageCode],
  );
  return ancestorsAsString;
};

export const getName = (enhet: Enhet, languageCode: LanguageCode): string => {
  if (languageCode === 'nb') {
    return enhet.navn;
  } else if (languageCode === 'nn') {
    return enhet.navnNynorsk ?? enhet.navn;
  } else if (languageCode === 'se') {
    return enhet.navnSami ?? enhet.navn;
  } else {
    return enhet.navnEngelsk ?? enhet.navn;
  }
};

export const useName = (enhet: Enhet): string => {
  const languageCode = useLanguageCode();
  const name = useMemo(
    () => getName(enhet, languageCode),
    [enhet, languageCode],
  );
  return name;
};
