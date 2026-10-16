'use client';

import { BellIcon } from '@navikt/aksel-icons';
import { EinLink } from '~/components/EinLink/EinLink';
import { useTranslation } from '~/hooks/useTranslation';
import styles from './FollowLink.module.scss';

export default function FollowLink({ labelKey }: { labelKey: string }) {
  const t = useTranslation();

  return (
    <EinLink unstyled href="#" className={styles.followLink}>
      <BellIcon aria-hidden="true" />
      {t(labelKey)}
    </EinLink>
  );
}
