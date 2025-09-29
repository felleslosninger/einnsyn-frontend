'use client';

import { useParams } from 'next/navigation';
import { EinLink } from '~/components/EinLink/EinLink';
import { useOptimisticPathname } from '~/components/NavigationProvider/NavigationProvider';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import styles from './AdminTabs.module.scss';

export default function AdminTabs() {
  const pathname = useOptimisticPathname();
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
    </div>
  );
}
