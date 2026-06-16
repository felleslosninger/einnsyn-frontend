'use client';

import { type Enhet, isEnhet, type Saksmappe } from '@digdir/einnsyn-sdk';
import { BellIcon, FolderFileIcon } from '@navikt/aksel-icons';
import { EinLink } from '~/components/EinLink/EinLink';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { dateFormat } from '~/lib/utils/dateFormat';
import { capitalize } from '~/lib/utils/stringutils';
import { generateEnhetUrl } from '~/lib/utils/urlGenerators';
import styles from './SaksmappeHeader.module.scss';

// Rendered inside the sticky site header (the `@header/case` slot), below the
// breadcrumb chrome row. The site `Header` toggles a global `header-minimized`
// class on scroll-down; under it everything except the <h1> collapses, leaving a
// compact one-line title. The <h1> is deliberately a sibling of the collapsing
// groups (not nested inside them) so it survives the collapse. Root is a <div>,
// not a <header>, to avoid nesting a second banner landmark inside the site header.
export default function SaksmappeHeader({
  saksmappe,
}: {
  saksmappe: Saksmappe;
}) {
  const t = useTranslation();
  const languageCode = useLanguageCode();

  const e = saksmappe.administrativEnhetObjekt;
  const enhet: Enhet | undefined = isEnhet(e) ? e : undefined;

  return (
    <div className={styles.saksmappeHeader}>
      <div className={styles.body}>
        <div className={styles.main}>
          <div className={styles.collapseRow}>
            <div className={styles.kindRow}>
              <span className={styles.kindIcon} aria-hidden="true">
                <FolderFileIcon />
              </span>
              <span className={styles.kindLabel}>{t('saksmappe.label')}</span>
            </div>
          </div>

          <h1 className={styles.title}>{saksmappe.offentligTittel}</h1>

          <div className={styles.collapseRow}>
            <div className={styles.metaAndFollow}>
              <dl className={styles.metaRow}>
                <div className={styles.metaItem}>
                  <dt>{t('saksmappe.saksnummer')}:</dt>
                  <dd>{saksmappe.saksnummer}</dd>
                </div>
                {saksmappe.saksdato && (
                  <div className={styles.metaItem}>
                    <dt>{t('saksmappe.journalfoert')}:</dt>
                    <dd>{dateFormat(saksmappe.saksdato, languageCode)}</dd>
                  </div>
                )}
                {saksmappe.publisertDato && (
                  <div className={styles.metaItem}>
                    <dt>{t('common.publishedAt')}:</dt>
                    <dd>{dateFormat(saksmappe.publisertDato, languageCode)}</dd>
                  </div>
                )}
              </dl>

              <EinLink href="#" className={styles.followLink}>
                <BellIcon aria-hidden="true" />
                <span>{t('saksmappe.follow')}</span>
              </EinLink>
            </div>
          </div>
        </div>

        {enhet && (
          <aside className={cn(styles.enhetCard, 'enhetCard')}>
            <div className={cn('ds-card__block', styles.enhetCardBlock)}>
              <div className={styles.enhetCardHeading}>
                {t('saksmappe.publishedBy')}
              </div>
              <EinLink
                href={generateEnhetUrl(enhet)}
                className={styles.enhetName}
              >
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
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
