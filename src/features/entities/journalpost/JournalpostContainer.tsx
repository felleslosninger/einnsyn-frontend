'use client';

import { Skeleton } from '@digdir/designsystemet-react';
import {
  type Dokumentbeskrivelse,
  isDokumentbeskrivelse,
  isSaksmappe,
  isSkjerming,
  type Journalpost,
} from '@digdir/einnsyn-sdk';
import { ExternalLinkIcon } from '@navikt/aksel-icons';
import { EinButton } from '~/components/EinButton/EinButton';
import { partyNames } from '~/features/entities/journalpost/Korrespondansepart';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import type { TranslateFunction } from '~/lib/translation/translation';
import cn from '~/lib/utils/className';
import { dateFormat } from '~/lib/utils/dateFormat';
import { useFileURLGenerator } from '~/lib/utils/urlGenerators';
import styles from './JournalpostContainer.module.scss';

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
  // Unexpanded id strings mean the detail expand hasn't resolved yet; skeleton
  // the documents until it lands.
  const documentsPending = (journalpost.dokumentbeskrivelse ?? []).some(
    (db) => typeof db === 'string',
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

  const senders = partyNames(journalpost, 'avsender');
  const receivers = partyNames(journalpost, 'mottaker');
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
            {partySummary(senders, 'avsender', t)}
          </Field>
        )}
        {receivers.length > 0 && (
          <Field label={t('journalpost.to')}>
            {partySummary(receivers, 'mottaker', t)}
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

// Several parties get a count, and a name they all share (a screening marker
// such as "Avskjermet") is given once rather than repeated.
function partySummary(
  names: string[],
  role: 'avsender' | 'mottaker',
  t: TranslateFunction,
): string {
  const [first] = names;
  if (names.length === 1) {
    return first;
  }
  if (names.every((name) => name === first)) {
    // A capitalised single word reads as an adjective after "alle".
    const shared = /^\p{Lu}\p{Ll}+$/u.test(first)
      ? first.toLocaleLowerCase()
      : first;
    return t(
      `journalpost.partyCountAllSame.${role}`,
      String(names.length),
      shared,
    );
  }
  return t(
    `journalpost.partyCount.${role}`,
    String(names.length),
    names.join(', '),
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
