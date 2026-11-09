'use client';

import { useOptimisticPathname } from '~/components/NavigationProvider/NavigationProvider';
import { HeaderTab, HeaderTabs } from '~/features/header/HeaderTabs';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import { toLocalizedPath } from '~/lib/routing/pathname';
import { brukerRoutes } from './brukerRoutes';

export default function BrukerTabs() {
  const pathname = useOptimisticPathname();
  const t = useTranslation();
  const languageCode = useLanguageCode();

  return (
    <nav aria-label={t('bruker.title')}>
      <HeaderTabs>
        {brukerRoutes.map(({ route, translationKey }) => {
          const href = toLocalizedPath(languageCode, route);
          return (
            <HeaderTab key={route} href={href} active={pathname === href}>
              {t(translationKey)}
            </HeaderTab>
          );
        })}
      </HeaderTabs>
    </nav>
  );
}
