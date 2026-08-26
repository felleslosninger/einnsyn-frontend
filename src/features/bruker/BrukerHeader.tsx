'use client';

import { ArrowLeftIcon } from '@navikt/aksel-icons';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinLink } from '~/components/EinLink/EinLink';
import { useTranslation } from '~/hooks/useTranslation';
import BrukerTabs from './BrukerTabs';
import styles from './BrukerHeader.module.scss';

export default function BrukerHeader() {
  const t = useTranslation();

  return (
    <>
      <EinButton
        asChild
        data-size="sm"
        data-color="neutral"
        variant="tertiary"
        className={styles.navigationLink}
      >
        <a href="/search">
          <ArrowLeftIcon aria-hidden="true" />
          {t('bruker.backToSearch')}
        </a>
      </EinButton>
      <BrukerTabs />
    </>
  );
}
