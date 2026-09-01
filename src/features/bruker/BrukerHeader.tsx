'use client';

import { ArrowLeftIcon } from '@navikt/aksel-icons';
import { EinButton } from '~/components/EinButton/EinButton';
import { useTranslation } from '~/hooks/useTranslation';
import styles from './BrukerHeader.module.scss';
import BrukerTabs from './BrukerTabs';
import { Heading } from '@digdir/designsystemet-react';

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
