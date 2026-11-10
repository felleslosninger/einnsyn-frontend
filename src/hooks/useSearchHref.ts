'use client';

import { useCallback } from 'react';
import { useSearchField } from '~/components/SearchField/SearchFieldProvider';
import { buildSearchHref, type SearchParams } from '~/lib/routing/searchParams';
import { useLanguageCode } from './useLanguageCode';

/**
 * {@link buildSearchHref} for the search the viewer is in, in their language:
 * pass only what changes. That is the current, optimistic URL on a results
 * page, and the remembered search on a detail page (see `searchTarget`).
 */
export function useSearchHref() {
  const { searchTarget } = useSearchField();
  const languageCode = useLanguageCode();

  return useCallback(
    (updates?: Partial<SearchParams>) =>
      buildSearchHref({ ...searchTarget, languageCode, updates }),
    [searchTarget, languageCode],
  );
}
