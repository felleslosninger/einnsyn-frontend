'use client';

import { CalendarIcon } from '@navikt/aksel-icons';
import { EinLink } from '~/components/EinLink/EinLink';
import {
  useOptimisticPathname,
  useOptimisticSearchParams,
} from '~/components/NavigationProvider/NavigationProvider';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { buildSearchHref } from '~/lib/utils/searchHref';
import resultStyles from '../searchresult/searchResultStyles.module.scss';
import SearchFilterDropdown from './filter/SearchFilterDropdown';
import styles from './SearchTabs.module.scss';

export default function SearchTabs({ className }: { className?: string }) {
  const searchParams = useOptimisticSearchParams();
  const pathname = useOptimisticPathname();
  const t = useTranslation();

  // The "all" tab is the absence of an `entity` param, which `buildSearchHref`
  // handles as the empty string.
  const searchPathname = pathname.startsWith('/calendar')
    ? '/search'
    : pathname;
  const getTabHref = (entityName: string) =>
    buildSearchHref({
      pathname: searchPathname,
      searchParams,
      updates: { entity: entityName },
    });

  const getLinkClassName = (tabName: string) => {
    const classes: string[] = [styles.searchTab, 'header-tab'];
    const activeTab = searchParams?.get('entity') || '';
    if (!pathname.startsWith('/calendar') && activeTab === tabName) {
      classes.push('active');
    }
    return classes.join(' ');
  };

  return (
    <div
      className={cn(styles.tabsContainer, className, 'header-tabs')}
      data-size="sm"
      data-color="neutral"
    >
      <div className={styles.searchTabsScroll}>
        <div className={cn(styles.searchTabs)}>
          <EinLink className={getLinkClassName('')} href={getTabHref('')}>
            {t('common.all')}
          </EinLink>
          <EinLink
            className={getLinkClassName('Saksmappe')}
            href={getTabHref('Saksmappe')}
          >
            <span className={styles.tabInner}>
              <span
                className={cn(
                  resultStyles.searchResultDot,
                  resultStyles.searchResultDotSaksmappe,
                )}
                aria-hidden="true"
              />
              {t('saksmappe.labelPlural')}
            </span>
          </EinLink>
          <EinLink
            className={getLinkClassName('Journalpost')}
            href={getTabHref('Journalpost')}
          >
            <span className={styles.tabInner}>
              <span
                className={cn(
                  resultStyles.searchResultDot,
                  resultStyles.searchResultDotJournalpost,
                )}
                aria-hidden="true"
              />
              {t('journalpost.labelPlural')}
            </span>
          </EinLink>
          <EinLink
            className={getLinkClassName('Moetemappe')}
            href={getTabHref('Moetemappe')}
          >
            <span className={styles.tabInner}>
              <span
                className={cn(
                  resultStyles.searchResultDot,
                  resultStyles.searchResultDotMoetemappe,
                )}
                aria-hidden="true"
              />
              {t('moetemappe.labelPlural')}
            </span>
          </EinLink>
          <EinLink
            className={getLinkClassName('Moetesak')}
            href={getTabHref('Moetesak')}
          >
            <span className={styles.tabInner}>
              <span
                className={cn(
                  resultStyles.searchResultDot,
                  resultStyles.searchResultDotMoetesak,
                )}
                aria-hidden="true"
              />
              {t('moetesak.labelPlural')}
            </span>
          </EinLink>

          <span className={styles.tabDivider} aria-hidden="true" />

          <EinLink
            className={cn(styles.searchTab, 'header-tab', {
              active: pathname.startsWith('/calendar'),
            })}
            href={`/calendar${searchParams?.get('enhet') ? `?enhet=${searchParams?.get('enhet')}` : ''}`}
          >
            <span className={styles.tabInner}>
              {/* <CalendarIcon aria-hidden="true" className={styles.tabIcon} /> */}
              {t('calendar.label')}
            </span>
          </EinLink>
        </div>
      </div>

      <div className={cn(styles.searchFilter, 'search-filter')}>
        <SearchFilterDropdown className="header-dropdown" />
      </div>
    </div>
  );
}
