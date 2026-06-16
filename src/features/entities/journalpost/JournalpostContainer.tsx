'use client';

import { Skeleton } from '@digdir/designsystemet-react';
import {
  type Dokumentbeskrivelse,
  isDokumentbeskrivelse,
  isSkjerming,
  type Journalpost,
} from '@digdir/einnsyn-sdk';
import { ExternalLinkIcon } from '@navikt/aksel-icons';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinLink } from '~/components/EinLink/EinLink';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { dateFormat } from '~/lib/utils/dateFormat';
import { generateFileUrl } from '~/lib/utils/urlGenerators';
import styles from './JournalpostContainer.module.scss';

export default function JournalpostContainer({
  journalpost,
  documentsPending = false,
  inline = false,
}: {
  journalpost: Journalpost | null;
  documentsPending?: boolean;
  // Rendered inside a journalpost list row, which already supplies the title.
  // Drop the heading (avoids duplicating it) and the horizontal inset so the
  // content aligns with the row title.
  inline?: boolean;
}) {
  const t = useTranslation();
  const languageCode = useLanguageCode();

  if (journalpost === null) {
    return (
      <>
        <div>{t('journalpost.label')}</div>
        <h2>{t('journalpost.404')}</h2>
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

  // In the list payload `dokumentbeskrivelse` is unexpanded (string ids), so we
  // know how many documents exist but not their type, title or files. Use the
  // count to size the loading skeleton while the detail expand resolves.
  const pendingDocumentCount = (journalpost.dokumentbeskrivelse ?? []).length;

  const korrparts = (journalpost.korrespondansepart ?? []).filter(
    (k) => typeof k !== 'string',
  );
  const senders = korrparts
    .filter((k) => /^[Aa]vsender$/.test(k.korrespondanseparttype))
    .map((k) => k.korrespondansepartNavnSensitiv)
    .join(', ');
  const receivers = korrparts
    .filter((k) => /^[Mm]ottaker$/.test(k.korrespondanseparttype))
    .map((k) => k.korrespondansepartNavnSensitiv)
    .join(', ');

  const typeLabel = t(`journalpost.type.${journalpost.journalposttype}`);

  return (
    <article className={cn(styles.content, { [styles.inline]: inline })}>
      {!inline && (
        <div className={styles.heading}>
          <h2 className={styles.title}>{journalpost.offentligTittel}</h2>
        </div>
      )}

      <dl className={styles.fields}>
        <Field label={t('journalpost.recordType')}>
          <span className={styles.typeLabel}>{typeLabel}</span>
        </Field>
        {senders && <Field label={t('journalpost.from')}>{senders}</Field>}
        {receivers && <Field label={t('journalpost.to')}>{receivers}</Field>}
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
        {isSkjerming(journalpost.skjerming) &&
          journalpost.skjerming.skjermingshjemmel && (
            <Field label={t('journalpost.legalBasis')}>
              {journalpost.skjerming.skjermingshjemmel}
            </Field>
          )}
      </dl>

      {!documentsPending && hasUndownloadableDocument && (
        // TODO: wire up the "order access" flow.
        <div className={styles.orderAccess}>
          <EinButton style="secondary">
            {t('journalpost.orderAccess')}
          </EinButton>
        </div>
      )}

      {documentsPending ? (
        <DocumentSectionSkeleton count={pendingDocumentCount} />
      ) : (
        <>
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
        </>
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
  const dokumentobjekter = (document.dokumentobjekt ?? []).filter(
    (dob) => typeof dob !== 'string',
  );
  const primary = dokumentobjekter[0];

  return (
    <li className={styles.documentItem}>
      {primary ? (
        <EinLink
          href={generateFileUrl(primary)}
          className={styles.documentLink}
        >
          <span>{document.tittel}</span>
          <ExternalLinkIcon aria-hidden="true" />
        </EinLink>
      ) : (
        <span className={styles.documentItemTitle}>{document.tittel}</span>
      )}
    </li>
  );
}

// Stable keys for the placeholder cards so we avoid array-index keys while the
// rendered card count is derived at runtime.
const DOCUMENT_SKELETON_KEYS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

function DocumentSectionSkeleton({ count }: { count: number }) {
  if (count <= 0) return null;
  // Mirror the resolved layout — a main-document section (one card) plus an
  // attachments section — so the documents area doesn't restructure on resolve.
  // The first document is assumed to be the hoveddokument (the common case), so
  // the attachments section holds the remaining count.
  const attachmentKeys = DOCUMENT_SKELETON_KEYS.slice(
    0,
    Math.min(count - 1, DOCUMENT_SKELETON_KEYS.length - 1),
  );
  return (
    <>
      <section
        className={styles.documentSection}
        aria-busy="true"
        aria-live="polite"
      >
        <h3 className={styles.documentSectionHeading}>
          <Skeleton variant="text" width="9rem" />
        </h3>
        <ul className={styles.documentList}>
          <DocumentItemSkeleton />
        </ul>
      </section>
      {attachmentKeys.length > 0 && (
        <section className={styles.documentSection} aria-busy="true">
          <h3 className={styles.documentSectionHeading}>
            <Skeleton variant="text" width="7rem" />
          </h3>
          <ul className={styles.documentList}>
            {attachmentKeys.map((key) => (
              <DocumentItemSkeleton key={key} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function DocumentItemSkeleton() {
  return (
    <li className={styles.documentItem}>
      <Skeleton variant="text" width="60%" />
    </li>
  );
}
