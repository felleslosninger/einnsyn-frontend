import { type Enhet, isEnhet } from '@digdir/einnsyn-sdk';

export const getAncestors = (enhet: Enhet) => {
  const ancestors: Enhet[] = [];
  let current: Enhet | string | undefined = enhet;
  while (isEnhet(current) && current.enhetstype !== 'DUMMYENHET') {
    ancestors.unshift(current);
    current = current.parent;
  }
  return ancestors;
};

export const getEnhetHref = (enhet: Enhet) => {
  const ancestors = getAncestors(enhet);
  return ancestors.map((ancestor) => ancestor.id).join('/');
};
