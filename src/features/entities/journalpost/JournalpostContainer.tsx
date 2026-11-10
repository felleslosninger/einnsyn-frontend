'use client';

import {
  type Dokumentbeskrivelse,
  isDokumentbeskrivelse,
  isSaksmappe,
  isSkjerming,
  type Journalpost,
} from '@digdir/einnsyn-sdk';
import { ExternalLinkIcon } from '@navikt/aksel-icons';
import { EinButton } from '~/components/EinButton/EinButton';
import { getParties } from '~/features/entities/journalpost/Korrespondansepart';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { dateFormat } from '~/lib/utils/dateFormat';
import { useFileURLGenerator } from '~/lib/utils/urlGenerators';
import styles from './JournalpostContainer.module.scss';
import { PartyList } from './PartyList';

export default function JournalpostContainer({
  journalpost,
}: {
  journalpost: Journalpost | null;
}) {
  const t = useTranslation();
  const languageCode = useLanguageCode();

  if (journalpost === null) {
    return (
      <>
        <div>{t('journalpost.label')}</div>
        <h2 className="ds-heading">{t('journalpost.404')}</h2>
      </>
    );
  }

  const dokumentbeskrivelser = (journalpost.dokumentbeskrivelse ?? []).filter(
    (db): db is Dokumentbeskrivelse => typeof db !== 'string',
  );
  const mainDocument = dokumentbeskrivelser.find((db) =>
    db.tilknyttetRegistreringSom.endsWith('hoveddokument'),
  );
  const attachments = dokumentbeskrivelser.filter((db) =>
    db.tilknyttetRegistreringSom.endsWith('vedlegg'),
  );

  // Nothing to download — either there are no document descriptions at all, or
  // at least one has no expanded dokumentobjekt (no file). The user must request
  // access instead.
  const hasUndownloadableDocument =
    dokumentbeskrivelser.length === 0 ||
    dokumentbeskrivelser.some(
      (db) =>
        (db.dokumentobjekt ?? []).filter((dob) => typeof dob !== 'string')
          .length === 0,
    );

  const senders = getParties(journalpost, 'avsender');
  const receivers = getParties(journalpost, 'mottaker');
  const saksnummer = isSaksmappe(journalpost.saksmappe)
    ? journalpost.saksmappe.saksnummer
    : undefined;

  return (
    // No title, type or publishing date here: this renders inline underneath
    // the list row, which already shows them.
    <article className={styles.content} data-size="sm">
      <dl className={styles.fields}>
        {senders.length > 0 && (
          <Field label={t('journalpost.from')}>
            <PartyList parties={senders} type="avsender" />
          </Field>
        )}
        {receivers.length > 0 && (
          <Field label={t('journalpost.to')}>
            <PartyList parties={receivers} type="mottaker" />
          </Field>
        )}
        {journalpost.dokumentetsDato && (
          <Field label={t('journalpost.docDate')}>
            {dateFormat(journalpost.dokumentetsDato, languageCode)}
          </Field>
        )}
        {journalpost.journaldato && (
          <Field label={t('saksmappe.journalfoert')}>
            {dateFormat(journalpost.journaldato, languageCode)}
          </Field>
        )}
        {journalpost.publisertDato && (
          <Field label={t('common.publishedAt')}>
            {dateFormat(journalpost.publisertDato, languageCode)}
          </Field>
        )}
        {journalpost.oppdatertDato &&
          journalpost.oppdatertDato !== journalpost.publisertDato && (
            <Field label={t('common.updatedAt')}>
              {dateFormat(journalpost.oppdatertDato, languageCode)}
            </Field>
          )}
        {saksnummer && (
          <Field label={t('journalpost.number')}>
            {`${saksnummer}-${journalpost.journalpostnummer}`}
          </Field>
        )}
        {isSkjerming(journalpost.skjerming) &&
          journalpost.skjerming.skjermingshjemmel && (
            <Field label={t('journalpost.legalBasis')}>
              {journalpost.skjerming.skjermingshjemmel}
            </Field>
          )}
      </dl>

      {hasUndownloadableDocument && (
        // TODO: wire up the "order access" flow.
        <div className={styles.orderAccess}>
          <EinButton style="secondary">
            {t('journalpost.orderAccess')}
          </EinButton>
        </div>
      )}

      {isDokumentbeskrivelse(mainDocument) && (
        <section className={styles.documentSection}>
          <h3 className={styles.documentSectionHeading}>
            {t('journalpost.mainDocument')}
          </h3>
          <ul className={styles.documentList}>
            <DocumentItem document={mainDocument} />
          </ul>
        </section>
      )}

      {attachments.length > 0 && (
        <section className={styles.documentSection}>
          <h3 className={styles.documentSectionHeading}>
            {`${t('journalpost.attachmentPlural')} (${attachments.length})`}
          </h3>
          <ul className={styles.documentList}>
            {attachments.map((attachment) => (
              <DocumentItem key={attachment.id} document={attachment} />
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.field}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function DocumentItem({ document }: { document: Dokumentbeskrivelse }) {
  const generateFileURL = useFileURLGenerator();
  const dokumentobjekter = (document.dokumentobjekt ?? []).filter(
    (dob) => typeof dob !== 'string',
  );
  const primary = dokumentobjekter[0];

  return (
    <li className={styles.documentItem}>
      {primary ? (
        // Cross-origin download, so a plain anchor rather than EinLink.
        <a
          href={generateFileURL(primary)}
          className={cn('ds-link', styles.documentLink)}
        >
          <span>{document.tittel}</span>
          <ExternalLinkIcon aria-hidden="true" />
        </a>
      ) : (
        <span className={styles.documentItemTitle}>{document.tittel}</span>
      )}
    </li>
  );
}
