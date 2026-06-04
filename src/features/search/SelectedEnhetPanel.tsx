'use client';

import type { Enhet } from '@digdir/einnsyn-sdk';
import { useEffect, useState } from 'react';
import { getEnhetInfo } from '~/actions/api/enhet';
import { useTranslation } from '~/hooks/useTranslation';
import styles from './SelectedEnhetPanel.module.scss';
import { Heading } from '@digdir/designsystemet-react';
import { Buildings3Icon } from '@navikt/aksel-icons';
import { EinLink } from '~/components/EinLink/EinLink';

function EnhetCard({ enhet }: { enhet: Enhet }) {
  const t = useTranslation();

  return (
    <div className={styles.enhetCard}>
      <span className={styles.enhetName}>{enhet.navn}</span>
      {enhet.kontaktpunktTelefon && (
        <span className={styles.enhetDetail}>
          <span className={styles.label}>{t('common.phone')}:</span>{' '}
          {enhet.kontaktpunktTelefon}
        </span>
      )}
      <span className={styles.enhetDetail}>
        <span className={styles.label}>{t('common.email')}:</span>{' '}
        <EinLink
          href={`mailto:${enhet.kontaktpunktEpost}`}
          className={styles.link}
        >
          {enhet.kontaktpunktEpost}
        </EinLink>
      </span>
      {enhet.kontaktpunktAdresse && (
        <span className={styles.enhetDetail}>{enhet.kontaktpunktAdresse}</span>
      )}
    </div>
  );
}

export default function SelectedEnheterPanel({
  enhetIds,
}: {
  enhetIds: string[];
}) {
  const t = useTranslation();
  const [enheter, setEnheter] = useState<Enhet[]>([]);

  useEffect(() => {
    if (!enhetIds.length) return;
    getEnhetInfo(enhetIds).then(setEnheter);
  }, [enhetIds]);

  if (!enheter.length) return null;

  return (
    <aside className={styles.panel}>
      <Heading level={3} data-size="sm" className={styles.heading}>
        <Buildings3Icon />
        {t('search.selectedEnheter')}
      </Heading>
      {enheter.map((enhet) => (
        <EnhetCard key={enhet.id} enhet={enhet} />
      ))}
    </aside>
  );
}
