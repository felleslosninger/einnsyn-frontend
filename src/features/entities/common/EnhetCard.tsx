'use client';

import type { Enhet } from '@digdir/einnsyn-sdk';
import { EinLink } from '~/components/EinLink/EinLink';
import { useTranslation } from '~/hooks/useTranslation';
import { capitalize } from '~/lib/utils/stringutils';
import { generateEnhetURL } from '~/lib/utils/urlGenerators';
import styles from './EnhetCard.module.scss';

/**
 * Contact details for the enhet behind an entity, as the page layout's side
 * card. `headingKey` names the relationship, which differs per entity type — a
 * saksmappe is published by its enhet, a moetemappe belongs to its utvalg.
 */
export default function EnhetCard({
  enhet,
  headingKey,
}: {
  enhet: Enhet;
  headingKey: string;
}) {
  const t = useTranslation();

  return (
    <aside className={styles.enhetCard} data-size="sm">
      <div className={styles.enhetCardHeading}>{t(headingKey)}</div>
      <EinLink href={generateEnhetURL(enhet)} className={styles.enhetName}>
        {enhet.navn}
      </EinLink>
      <div className={styles.enhetFields}>
        {enhet.kontaktpunktTelefon && (
          <div className={styles.enhetField}>
            <span className={styles.enhetFieldLabel}>
              {capitalize(t('virksomhet.telefon'))}
            </span>{' '}
            <span className={styles.enhetFieldValue}>
              {enhet.kontaktpunktTelefon}
            </span>
          </div>
        )}
        {enhet.kontaktpunktEpost && (
          <div className={styles.enhetField}>
            <span className={styles.enhetFieldLabel}>
              {capitalize(t('virksomhet.epost'))}
            </span>{' '}
            <EinLink href={`mailto:${enhet.kontaktpunktEpost}`}>
              {enhet.kontaktpunktEpost}
            </EinLink>
          </div>
        )}
        {enhet.kontaktpunktAdresse && (
          <div className={styles.enhetField}>
            <span className={styles.enhetFieldLabel}>
              {capitalize(t('virksomhet.adresse'))}
            </span>{' '}
            <span className={styles.enhetFieldValue}>
              {enhet.kontaktpunktAdresse}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
