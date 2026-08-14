'use client';

import { useParams } from 'next/navigation';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import { parseParamList } from '~/lib/utils/paramList';
import { pathnameContainsEnhet } from '~/lib/utils/searchHref';

/**
 * Returns the raw enhet identifiers currently active as a filter.
 * Both path-based enhet (e.g. /oslo-kommune) and any ?enhet= query params.
 */
export function useEnhetFilterIds(): string[] {
  const { optimisticPathname, optimisticSearchParams } = useNavigation();
  const params = useParams<{ enhet?: string }>();

  const pathEnhetValue = pathnameContainsEnhet(optimisticPathname, params.enhet)
    ? params.enhet
    : undefined;

  return [
    ...(pathEnhetValue ? [pathEnhetValue] : []),
    ...parseParamList(optimisticSearchParams.get('enhet') ?? ''),
  ];
}
