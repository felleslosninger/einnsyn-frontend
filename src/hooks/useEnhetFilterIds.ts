'use client';

import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import { getEnhetIdentifier, type TrimmedEnhet } from '~/lib/utils/enhetUtils';
import { normalizeParamList, parseParamList } from '~/lib/utils/paramList';
import { pathnameContainsEnhet } from '~/lib/utils/searchHref';

/**
 * The enhet selection encoded in the URL: the path enhet (`/oslo`) plus every
 * `enhet` search param, as `getSearchResults` reads them server-side.
 * Optimistic like `useOptimisticPathname`, so selection UIs show what the user
 * just picked instead of snapping back mid-navigation. The `enhet` route param
 * outlives the URL when navigating away from `/{enhet}`, hence the guard.
 *
 * `enhetMap` canonicalizes each value to its {@link getEnhetIdentifier} form,
 * so an id and its slug dedupe and the string comparisons in
 * `useEnhetSelectorState` match. Callers outside `EnhetCacheProvider` omit it.
 */
export function useEnhetFilterIds(
  enhetMap?: ReadonlyMap<string, TrimmedEnhet>,
) {
  const { optimisticPathname, optimisticSearchParams } = useNavigation();
  const params = useParams<{ enhet?: string }>();

  const optimisticPathEnhet = pathnameContainsEnhet(
    optimisticPathname,
    params.enhet,
  )
    ? params.enhet
    : undefined;

  const pathEnhetValue = useMemo(() => {
    if (!optimisticPathEnhet) {
      return undefined;
    }

    const enhet = enhetMap?.get(optimisticPathEnhet);
    return enhet ? getEnhetIdentifier(enhet) : optimisticPathEnhet;
  }, [optimisticPathEnhet, enhetMap]);

  const selectedEnhetIdentifiers = useMemo(() => {
    const parsed = [
      ...(pathEnhetValue ? [pathEnhetValue] : []),
      ...optimisticSearchParams
        .getAll('enhet')
        .flatMap((value) => parseParamList(value)),
    ];
    return normalizeParamList(
      parsed.map((value) => {
        const enhet = enhetMap?.get(value);
        return enhet ? getEnhetIdentifier(enhet) : value;
      }),
    );
  }, [enhetMap, optimisticSearchParams, pathEnhetValue]);

  return { pathEnhetValue, selectedEnhetIdentifiers };
}
