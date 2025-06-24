'use client';

import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { EinLink } from '~/components/EinLink/EinLink';
import { useTranslation } from '~/hooks/useTranslation';

import styles from './AdminTabs.module.scss';
import cn from '~/lib/utils/className';

export default function AdminTabs() {
  const pathname = usePathname();
  const { enhetId } = useParams<{ enhetId: string }>() ?? {};
  const t = useTranslation();

  const getLinkClassName = (linkPathname: string) => {
    const classes: string[] = [styles['admin-tab'], 'header-tab'];
    if (linkPathname === pathname) {
      classes.push('active');
    }
    return classes.join(' ');
  };

  return (
    <div className={cn(styles['admin-tabs'], 'header-tabs')} data-size="sm">
      <EinLink
        className={getLinkClassName(`/admin/${enhetId}/api-keys`)}
        href={`/admin/${enhetId}/api-keys`}
      >
        {t('admin.apiKey.labelPlural')}
      </EinLink>
      <EinLink
        className={getLinkClassName(`/admin/${enhetId}status-messages`)}
        href={`/admin/${enhetId}/status-messages`}
      >
        {t('admin.statusMessage.labelPlural')}
      </EinLink>
    </div>
  );
}
