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

export default function SearchTabs({ className }: { className?: string }) {
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
      className={cn(styles.tabsContainer, className, 'header-tabs')}
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
          <span className={styles.tabInner}>
            <span
              className={cn(
                'search-result-dot',
                'search-result-dot--saksmappe',
              )}
              aria-hidden="true"
            />
            {t('saksmappe.labelPlural')}
          </span>
        </EinLink>
        <EinLink
          className={getLinkClassName('Journalpost')}
          href={getLinkUrl('Journalpost')}
        >
          <span className={styles.tabInner}>
            <span
              className={cn(
                'search-result-dot',
                'search-result-dot--journalpost',
              )}
              aria-hidden="true"
            />
            {t('journalpost.labelPlural')}
          </span>
        </EinLink>
        <EinLink
          className={getLinkClassName('Moetemappe')}
          href={getLinkUrl('Moetemappe')}
        >
          <span className={styles.tabInner}>
            <span
              className={cn(
                'search-result-dot',
                'search-result-dot--moetemappe',
              )}
              aria-hidden="true"
            />
            {t('moetemappe.labelPlural')}
          </span>
        </EinLink>
        <EinLink
          className={getLinkClassName('Moetesak')}
          href={getLinkUrl('Moetesak')}
        >
          <span className={styles.tabInner}>
            <span
              className={cn('search-result-dot', 'search-result-dot--moetesak')}
              aria-hidden="true"
            />
            {t('moetesak.labelPlural')}
          </span>
        </EinLink>
      </div>

      <div className={cn(styles.searchFilter, 'search-filter')}>
        <SearchFilterDropdown className="header-dropdown" />
      </div>
    </div>
  );
}
