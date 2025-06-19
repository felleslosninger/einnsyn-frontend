'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { EinLink } from '~/components/EinLink/EinLink';
import { useTranslation } from '~/hooks/useTranslation';

import styles from './SearchResultTabs.module.scss';
import cn from '~/lib/utils/className';

export default function SearchResultTabs() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const t = useTranslation();

  const getLinkUrl = (entityName: string) => {
    const searchParamsCopy = new URLSearchParams(searchParams);
    if (entityName === '') {
      searchParamsCopy.delete('entity');
    } else {
      searchParamsCopy.set('entity', entityName);
    }
    return `${pathname}?${searchParamsCopy.toString()}`;
  };

  const getLinkClassName = (tabName: string) => {
    const classes: string[] = [styles['search-result-tab'], 'header-tab'];
    const activeTab = searchParams.get('entity') || '';
    if (activeTab === tabName) {
      classes.push('active');
    }
    return classes.join(' ');
  };

  return (
    <div
      className={cn(styles['search-result-tabs'], 'header-tabs')}
      data-size="sm"
    >
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
  );
}
