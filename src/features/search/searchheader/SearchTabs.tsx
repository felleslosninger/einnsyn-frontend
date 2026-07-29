'use client';

import { HeaderTab, HeaderTabs } from '~/components/HeaderTabs/HeaderTabs';
import {
  useOptimisticPathname,
  useOptimisticSearchParams,
} from '~/components/NavigationProvider/NavigationProvider';
import { useTranslation } from '~/hooks/useTranslation';
import SearchFilterDropdown from './filter/SearchFilterDropdown';

export default function SearchTabs({ className }: { className?: string }) {
  const searchParams = useOptimisticSearchParams();
  const pathname = useOptimisticPathname();
  const t = useTranslation();
  const activeTab = searchParams?.get('entity') || '';

  const getLinkUrl = (entityName: string) => {
    const searchParamsCopy = new URLSearchParams(searchParams ?? undefined);
    if (entityName === '') {
      searchParamsCopy.delete('entity');
    } else {
      searchParamsCopy.set('entity', entityName);
    }
    return `${pathname}?${searchParamsCopy.toString()}`;
  };

  return (
    <HeaderTabs
      className={className}
      actions={<SearchFilterDropdown className="header-dropdown" />}
    >
      <HeaderTab href={getLinkUrl('')} active={activeTab === ''}>
        {t('common.all')}
      </HeaderTab>
      <HeaderTab
        href={getLinkUrl('Saksmappe')}
        active={activeTab === 'Saksmappe'}
      >
        {t('saksmappe.labelPlural')}
      </HeaderTab>
      <HeaderTab
        href={getLinkUrl('Journalpost')}
        active={activeTab === 'Journalpost'}
      >
        {t('journalpost.labelPlural')}
      </HeaderTab>
      <HeaderTab
        href={getLinkUrl('Moetemappe')}
        active={activeTab === 'Moetemappe'}
      >
        {t('moetemappe.labelPlural')}
      </HeaderTab>
      <HeaderTab
        href={getLinkUrl('Moetesak')}
        active={activeTab === 'Moetesak'}
      >
        {t('moetesak.labelPlural')}
      </HeaderTab>
    </HeaderTabs>
  );
}
