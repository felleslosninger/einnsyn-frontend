'use client';

import { EinLink } from '~/components/EinLink/EinLink';
import {
  useOptimisticPathname,
  useOptimisticSearchParams,
} from '~/components/NavigationProvider/NavigationProvider';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { buildSearchHref } from '~/lib/utils/searchHref';
import SearchFilterDropdown from './filter/SearchFilterDropdown';
import styles from './SearchTabs.module.scss';

export default function SearchTabs({ className }: { className?: string }) {
  const searchParams = useOptimisticSearchParams();
  const pathname = useOptimisticPathname();
  const t = useTranslation();

  // The "all" tab is the absence of an `entity` param, which `buildSearchHref`
  // handles as the empty string.
  const getTabHref = (entityName: string) =>
    buildSearchHref({
      pathname,
      searchParams,
      updates: { entity: entityName },
    });

  const getLinkClassName = (tabName: string) => {
    const classes: string[] = [styles.searchTab, 'header-tab'];
    const activeTab = searchParams?.get('entity') || '';
    if (activeTab === tabName) {
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
      <div className={cn(styles.searchTabs)}>
        <EinLink className={getLinkClassName('')} href={getTabHref('')}>
          {t('common.all')}
        </EinLink>
        <EinLink
          className={getLinkClassName('Saksmappe')}
          href={getTabHref('Saksmappe')}
        >
          {t('saksmappe.labelPlural')}
        </EinLink>
        <EinLink
          className={getLinkClassName('Journalpost')}
          href={getTabHref('Journalpost')}
        >
          {t('journalpost.labelPlural')}
        </EinLink>
        <EinLink
          className={getLinkClassName('Moetemappe')}
          href={getTabHref('Moetemappe')}
        >
          {t('moetemappe.labelPlural')}
        </EinLink>
        <EinLink
          className={getLinkClassName('Moetesak')}
          href={getTabHref('Moetesak')}
        >
          {t('moetesak.labelPlural')}
        </EinLink>
      </div>

      <div className={cn(styles.searchFilter, 'search-filter')}>
        <SearchFilterDropdown className="header-dropdown" />
      </div>
    </div>
  );
}
