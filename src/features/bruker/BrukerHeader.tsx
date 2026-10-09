'use client';
import { Heading } from '@digdir/designsystemet-react';
import { useTranslation } from '~/hooks/useTranslation';
import styles from './BrukerHeader.module.scss';
import BrukerTabs from './BrukerTabs';

export default function BrukerHeader() {
  const t = useTranslation();

  return (
    <>
      <Heading className={styles.heading} data-size="sm">
        {t('bruker.title')}
      </Heading>
      <BrukerTabs />
    </>
  );
}
