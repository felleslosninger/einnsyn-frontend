'use client';

import { EinLink } from '~/components/EinLink/EinLink';
import { useOptimisticPathname } from '~/components/NavigationProvider/NavigationProvider';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import styles from './BrukerTabs.module.scss';

export default function BrukerTabs() {
  const pathname = useOptimisticPathname();
  const t = useTranslation();

  const getLinkClassName = (linkPathname: string) => {
    const classes: string[] = [styles['bruker-tab'], 'header-tab'];
    if (pathname === linkPathname) {
      classes.push('active');
    }
    return classes.join(' ');
  };

  return (
    <div className={cn(styles['bruker-tabs'], 'header-tabs')} data-size="sm">
      <EinLink
        className={getLinkClassName('/bruker/access-requests')}
        href="/bruker/access-requests"
      >
        {t('bruker.accessRequests')}
      </EinLink>
      <EinLink
        className={getLinkClassName('/bruker/saved-cases')}
        href="/bruker/saved-cases"
      >
        {t('bruker.savedCases')}
      </EinLink>
      <EinLink
        className={getLinkClassName('/bruker/saved-meetings')}
        href="/bruker/saved-meetings"
      >
        {t('bruker.savedMeetings')}
      </EinLink>
      <EinLink
        className={getLinkClassName('/bruker/saved-searches')}
        href="/bruker/saved-searches"
      >
        {t('bruker.savedSearches')}
      </EinLink>
      <EinLink
        className={getLinkClassName('/bruker/profile')}
        href="/bruker/profile"
      >
        {t('bruker.profile')}
      </EinLink>
    </div>
  );
}
