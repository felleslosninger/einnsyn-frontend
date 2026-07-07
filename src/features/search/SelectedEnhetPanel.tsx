'use client';

import { Details, Heading } from '@digdir/designsystemet-react';
import type { Enhet } from '@digdir/einnsyn-sdk';
import { Buildings3Icon } from '@navikt/aksel-icons';
import { useEffect, useState } from 'react';
import { getEnhetInfo } from '~/actions/api/enhet';
import { EinLink } from '~/components/EinLink/EinLink';
import { useTranslation } from '~/hooks/useTranslation';
import styles from './SelectedEnhetPanel.module.scss';

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

const SMALL_SCREEN_QUERY = '(max-width: 767px)';

export default function SelectedEnheterPanel({
  enhetIds,
}: {
  enhetIds: string[];
}) {
  const t = useTranslation();
  const [enheter, setEnheter] = useState<Enhet[]>([]);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const enhetIdsKey = enhetIds.join('|');

  // biome-ignore lint/correctness/useExhaustiveDependencies: enhetIdsKey is an intentional stable proxy for enhetIds to avoid re-running on every new array reference
  useEffect(() => {
    if (!enhetIds.length) return;
    getEnhetInfo(enhetIds).then(setEnheter);
  }, [enhetIdsKey]);
  useEffect(() => {
    const mq = window.matchMedia(SMALL_SCREEN_QUERY);
    setIsSmallScreen(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsSmallScreen(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (!enheter.length) return null;

  if (isSmallScreen) {
    return (
      <Details className={styles.details} data-color="neutral" data-size="sm">
        <Details.Summary>
          <Heading level={4} data-size="sm" className={styles.detailsheading}>
            <Buildings3Icon />
            {t('search.selectedEnheter')}
          </Heading>
        </Details.Summary>
        <Details.Content>
          {enheter.map((enhet) => (
            <EnhetCard key={enhet.id} enhet={enhet} />
          ))}
        </Details.Content>
      </Details>
    );
  }

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
