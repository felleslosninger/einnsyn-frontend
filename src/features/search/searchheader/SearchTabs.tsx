'use client';

import { EntityDot } from '~/components/EntityDot/EntityDot';
import { useOptimisticSearchParams } from '~/components/NavigationProvider/NavigationProvider';
import { HeaderTab, HeaderTabs } from '~/features/header/HeaderTabs';
import { useSearchHref } from '~/hooks/useSearchHref';
import { useTranslation } from '~/hooks/useTranslation';
import type { SearchableEntity } from '~/lib/routing/searchParams';

const ENTITY_TABS: { entity: SearchableEntity; labelKey: string }[] = [
  { entity: 'Saksmappe', labelKey: 'saksmappe.labelPlural' },
  { entity: 'Journalpost', labelKey: 'journalpost.labelPlural' },
  { entity: 'Moetemappe', labelKey: 'moetemappe.labelPlural' },
  { entity: 'Moetesak', labelKey: 'moetesak.labelPlural' },
];

export default function SearchTabs() {
  const searchParams = useOptimisticSearchParams();
  const searchHref = useSearchHref();
  const t = useTranslation();
  const activeEntity = searchParams?.get('entity') || undefined;

  return (
    <HeaderTabs>
      {/* The "all" tab is the absence of an `entity` param. */}
      <HeaderTab
        href={searchHref({ entity: undefined })}
        active={activeEntity === undefined}
      >
        {t('common.all')}
      </HeaderTab>
      {ENTITY_TABS.map(({ entity, labelKey }) => (
        <HeaderTab
          key={entity}
          href={searchHref({ entity })}
          active={activeEntity === entity}
          dot={<EntityDot entity={entity} />}
        >
          {t(labelKey)}
        </HeaderTab>
      ))}
    </HeaderTabs>
  );
}
