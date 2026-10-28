'use client';

import { useCallback } from 'react';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import { buildSearchHref, type SearchParams } from '~/lib/routing/searchParams';
import { useLanguageCode } from './useLanguageCode';

/**
 * {@link buildSearchHref} for the current, optimistic URL and the viewer's
 * language: pass only what changes.
 */
export function useSearchHref() {
  const { optimisticPathname, optimisticSearchParams } = useNavigation();
  const languageCode = useLanguageCode();

  return useCallback(
    (updates?: Partial<SearchParams>) =>
      buildSearchHref({
        pathname: optimisticPathname,
        searchParams: optimisticSearchParams,
        languageCode,
        updates,
      }),
    [optimisticPathname, optimisticSearchParams, languageCode],
  );
}
