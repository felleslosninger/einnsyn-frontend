'use client';

import { BellIcon } from '@navikt/aksel-icons';
import { EinLink } from '~/components/EinLink/EinLink';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import styles from './EntityHeaderBar.module.scss';

/**
 * The header's second row on an entity's routes: the breadcrumb trail (passed in
 * as `children`, since it is a server component that fetches) on the left, the
 * follow action pinned to the right.
 *
 * It keeps the `header-tabs` class so the header's scroll-down collapse takes
 * the trail and the action together, as one row.
 */
export default function EntityHeaderBar({
  children,
  followLabelKey,
}: {
  children: React.ReactNode;
  followLabelKey: string;
}) {
  const t = useTranslation();

  return (
    <div className={cn(styles.bar, 'header-tabs')}>
      <div className={styles.trail}>{children}</div>
      <EinLink href="#" className={styles.followLink}>
        <BellIcon aria-hidden="true" />
        <span>{t(followLabelKey)}</span>
      </EinLink>
    </div>
  );
}
