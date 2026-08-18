'use client';

import { Details, Heading } from '@digdir/designsystemet-react';
import type { Enhet } from '@digdir/einnsyn-sdk';
import { Buildings3Icon } from '@navikt/aksel-icons';
import { useEffect, useState } from 'react';
import { getEnhet } from '~/actions/api/enhet.actions';
import { EinLink } from '~/components/EinLink/EinLink';
import useBreakpoint from '~/hooks/useBreakpoint';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import styles from './SelectedEnhetPanel.module.scss';

function EnhetCard({ enhet }: { enhet: Enhet }) {
  const t = useTranslation();
  const formattedAdresse = enhet.kontaktpunktAdresse?.replaceAll(', ', '\n');

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
      {formattedAdresse && (
        <span className={cn(styles.enhetDetail, styles.address)}>
          {formattedAdresse}
        </span>
      )}
    </div>
  );
}

export default function SelectedEnhetPanel({
  enhetIds,
}: {
  enhetIds: string[];
}) {
  const t = useTranslation();
  const [enheter, setEnheter] = useState<Enhet[]>([]);
  const isLargeScreen = useBreakpoint('LG');
  const enhetIdsKey = enhetIds.join('|');

  // biome-ignore lint/correctness/useExhaustiveDependencies: enhetIdsKey is an intentional stable proxy for enhetIds to avoid re-running on every new array reference
  useEffect(() => {
    if (!enhetIds.length) {
      setEnheter([]);
      return;
    }

    let cancelled = false;
    getEnhet(enhetIds).then((result) => {
      if (!cancelled) {
        setEnheter(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [enhetIdsKey]);

  if (!enheter.length) return null;

  if (!isLargeScreen) {
    return (
      <Details className={styles.details} data-color="neutral" data-size="sm">
        <Details.Summary>
          <Heading level={4} data-size="sm" className={styles.detailsHeading}>
            <Buildings3Icon />
            {t('search.selectedEnheter+')}
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
      {enheter.map((enhet) => (
        <EnhetCard key={enhet.id} enhet={enhet} />
      ))}
    </aside>
  );
}
