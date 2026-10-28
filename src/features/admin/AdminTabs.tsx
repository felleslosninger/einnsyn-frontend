'use client';

import { useParams } from 'next/navigation';
import { useOptimisticPathname } from '~/components/NavigationProvider/NavigationProvider';
import { HeaderTab, HeaderTabs } from '~/features/header/HeaderTabs';
import { useTranslation } from '~/hooks/useTranslation';

export default function AdminTabs() {
  const pathname = useOptimisticPathname();
  const { enhetId } = useParams<{ enhetId: string }>() ?? {};
  const t = useTranslation();
  const apiKeysHref = `/admin/${enhetId}/api-keys`;

  return (
    <HeaderTabs>
      <HeaderTab href={apiKeysHref} active={pathname === apiKeysHref}>
        {t('admin.apiKey.labelPlural')}
      </HeaderTab>
    </HeaderTabs>
  );
}
