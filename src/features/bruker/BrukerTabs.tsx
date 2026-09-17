'use client';

import { EinLink } from '~/components/EinLink/EinLink';
import { useOptimisticPathname } from '~/components/NavigationProvider/NavigationProvider';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { brukerRoutes } from './brukerRoutes';

export default function BrukerTabs() {
  const pathname = useOptimisticPathname();
  const t = useTranslation();

  return (
    <nav aria-label={t('bruker.title')}>
      <div className="header-tabs" data-size="sm">
        {brukerRoutes.map(({ href, translationKey }) => (
          <EinLink
            key={href}
            className={cn('header-tab', { active: pathname === href })}
            href={href}
            aria-current={pathname === href ? 'page' : undefined}
          >
            {t(translationKey)}
          </EinLink>
        ))}
      </div>
    </nav>
  );
}
