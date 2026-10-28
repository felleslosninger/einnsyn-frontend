'use client';

import { useOptimisticSearchParams } from '~/components/NavigationProvider/NavigationProvider';
import { HeaderTab, HeaderTabs } from '~/features/header/HeaderTabs';
import { useSearchHref } from '~/hooks/useSearchHref';
import { useTranslation } from '~/hooks/useTranslation';
import type { SearchableEntity } from '~/lib/routing/searchParams';
import cn from '~/lib/utils/className';
import resultStyles from '../searchresult/searchResultStyles.module.scss';

const ENTITY_TABS: {
  entity: SearchableEntity;
  labelKey: string;
  dotClassName: string;
}[] = [
  {
    entity: 'Saksmappe',
    labelKey: 'saksmappe.labelPlural',
    dotClassName: resultStyles.searchResultDotSaksmappe,
  },
  {
    entity: 'Journalpost',
    labelKey: 'journalpost.labelPlural',
    dotClassName: resultStyles.searchResultDotJournalpost,
  },
  {
    entity: 'Moetemappe',
    labelKey: 'moetemappe.labelPlural',
    dotClassName: resultStyles.searchResultDotMoetemappe,
  },
  {
    entity: 'Moetesak',
    labelKey: 'moetesak.labelPlural',
    dotClassName: resultStyles.searchResultDotMoetesak,
  },
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
      {ENTITY_TABS.map(({ entity, labelKey, dotClassName }) => (
        <HeaderTab
          key={entity}
          href={searchHref({ entity })}
          active={activeEntity === entity}
        >
          <span
            className={cn(resultStyles.searchResultDot, dotClassName)}
            aria-hidden="true"
          />
          {t(labelKey)}
        </HeaderTab>
      ))}
    </HeaderTabs>
  );
}
