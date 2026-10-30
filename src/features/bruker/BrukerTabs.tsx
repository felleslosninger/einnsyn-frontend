'use client';

import { useOptimisticPathname } from '~/components/NavigationProvider/NavigationProvider';
import { HeaderTab, HeaderTabs } from '~/features/header/HeaderTabs';
import { useTranslation } from '~/hooks/useTranslation';
import styles from './BrukerHeader.module.scss';
import { brukerRoutes } from './brukerRoutes';

export default function BrukerTabs() {
  const pathname = useOptimisticPathname();
  const t = useTranslation();

  return (
    <nav className={styles.tabs} aria-label={t('bruker.title')}>
      <HeaderTabs>
        {brukerRoutes.map(({ href, translationKey }) => (
          <HeaderTab key={href} href={href} active={pathname === href}>
            {t(translationKey)}
          </HeaderTab>
        ))}
      </HeaderTabs>
    </nav>
  );
}
