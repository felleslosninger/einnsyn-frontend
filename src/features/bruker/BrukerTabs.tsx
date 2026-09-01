'use client';

import { EinLink } from '~/components/EinLink/EinLink';
import { useOptimisticPathname } from '~/components/NavigationProvider/NavigationProvider';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';

export default function BrukerTabs() {
  const pathname = useOptimisticPathname();
  const t = useTranslation();

  const tabClass = (linkPathname: string) =>
    cn('header-tab', { active: pathname === linkPathname });

  return (
    <div className="header-tabs" data-size="sm">
      <EinLink
        className={tabClass('/bruker/access-requests')}
        href="/bruker/access-requests"
      >
        {t('bruker.accessRequests')}
      </EinLink>
      <EinLink
        className={tabClass('/bruker/saved-cases')}
        href="/bruker/saved-cases"
      >
        {t('bruker.savedCases')}
      </EinLink>
      <EinLink
        className={tabClass('/bruker/saved-meetings')}
        href="/bruker/saved-meetings"
      >
        {t('bruker.savedMeetings')}
      </EinLink>
      <EinLink
        className={tabClass('/bruker/saved-searches')}
        href="/bruker/saved-searches"
      >
        {t('bruker.savedSearches')}
      </EinLink>
      <EinLink className={tabClass('/bruker/profile')} href="/bruker/profile">
        {t('bruker.profile')}
      </EinLink>
    </div>
  );
}
