'use client';

import { EinLink } from '~/components/EinLink/EinLink';
import {
  useOptimisticPathname,
  useOptimisticSearchParams,
} from '~/components/NavigationProvider/NavigationProvider';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import SearchFilterDropdown from './filter/SearchFilterDropdown';
import styles from './SearchTabs.module.scss';

export default function SearchTabs() {
  const searchParams = useOptimisticSearchParams();
  const pathname = useOptimisticPathname();
  const t = useTranslation();

  const getLinkUrl = (entityName: string) => {
    const searchParamsCopy = new URLSearchParams(searchParams ?? undefined);
    if (entityName === '') {
      searchParamsCopy.delete('entity');
    } else {
      searchParamsCopy.set('entity', entityName);
    }
    return `${pathname}?${searchParamsCopy.toString()}`;
  };

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
      className={cn(styles.tabsContainer, 'header-tabs')}
      data-size="sm"
      data-color="neutral"
    >
      <div className={cn(styles.searchTabs)}>
        <EinLink className={getLinkClassName('')} href={getLinkUrl('')}>
          {t('common.all')}
        </EinLink>
        <EinLink
          className={getLinkClassName('Saksmappe')}
          href={getLinkUrl('Saksmappe')}
        >
          {t('saksmappe.labelPlural')}
        </EinLink>
        <EinLink
          className={getLinkClassName('Journalpost')}
          href={getLinkUrl('Journalpost')}
        >
          {t('journalpost.labelPlural')}
        </EinLink>
        <EinLink
          className={getLinkClassName('Moetemappe')}
          href={getLinkUrl('Moetemappe')}
        >
          {t('moetemappe.labelPlural')}
        </EinLink>
        <EinLink
          className={getLinkClassName('Moetesak')}
          href={getLinkUrl('Moetesak')}
        >
          {t('moetesak.labelPlural')}
        </EinLink>
      </div>

      <div className={cn(styles.searchFilter, 'search-filter')}>
        <SearchFilterDropdown />
      </div>
    </div>
  );
}
