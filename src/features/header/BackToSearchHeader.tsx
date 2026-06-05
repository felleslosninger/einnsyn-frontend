'use client';

import { ArrowLeftIcon } from '@navikt/aksel-icons';
import type { MouseEvent } from 'react';
import { EinLink } from '~/components/EinLink/EinLink';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import { useTranslation } from '~/hooks/useTranslation';
import styles from './BackToSearchHeader.module.scss';

// The canonical search results route. Searching from the landing page lands
// here; searching from an enhet page stays on `/{enhet}` but carries a `q`
// query param. Both count as "arriving from search".
const SEARCH_PATHNAME = '/search';

/**
 * Renders a "Back to search" link in the case-page header, but only when the
 * user actually arrived from a search. Because that is the precondition, the
 * browser's previous history entry is the search results, so the link simply
 * calls `navigation.back()` — preserving the exact query, filters and scroll.
 *
 * "Arrived from search" is derived from the previous in-app URL tracked by
 * NavigationProvider (`document.referrer` is unreliable across client-side
 * navigations). On a deep-linked or hard-reloaded case page there is no known
 * previous URL, so nothing renders.
 */
export default function BackToSearchHeader() {
  const t = useTranslation();
  const navigation = useNavigation();
  const { previousPathname, previousSearchParamsString } = navigation;

  if (previousPathname === undefined) return null;

  const cameFromSearch =
    previousPathname === SEARCH_PATHNAME ||
    new URLSearchParams(previousSearchParamsString ?? '').has('q');

  if (!cameFromSearch) return null;

  // No-JS / middle-click target: the previous search URL itself.
  const href = previousSearchParamsString
    ? `${previousPathname}?${previousSearchParamsString}`
    : previousPathname;

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented) return;
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    navigation.back();
  };

  return (
    <div className={styles.backLinkRow}>
      <EinLink href={href} className={styles.backLink} onClick={handleClick}>
        <ArrowLeftIcon aria-hidden="true" />
        <span>{t('search.backToResults')}</span>
      </EinLink>
    </div>
  );
}
