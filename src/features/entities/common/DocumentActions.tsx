'use client';

import type { Dokumentbeskrivelse, Dokumentobjekt } from '@digdir/einnsyn-sdk';
import { DownloadIcon, EnvelopeClosedIcon } from '@navikt/aksel-icons';
import type { ReactNode } from 'react';
import { EinButton } from '~/components/EinButton/EinButton';
import EinDropdown from '~/components/EinDropdown/EinDropdown';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { generateFileUrl } from '~/lib/utils/urlGenerators';
import styles from './DocumentActions.module.scss';

/** A `dokumentbeskrivelse` array as the API returns it: expanded, or bare ids. */
type DokumentbeskrivelseRef = Dokumentbeskrivelse | string;

/** The first expanded dokumentobjekt of a document — its downloadable file. */
function fileOf(document: Dokumentbeskrivelse): Dokumentobjekt | undefined {
  return (document.dokumentobjekt ?? []).find(
    (dokumentobjekt): dokumentobjekt is Dokumentobjekt =>
      typeof dokumentobjekt !== 'string',
  );
}

/**
 * What a registrering's documents let you do, as a single button.
 *
 * Three shapes, chosen from the documents themselves:
 *
 *  - no document carries a file → "Bestill innsyn"
 *  - exactly one document, and it has a file → "Last ned dokument"
 *  - several documents, at least one with a file → a dropdown with one entry per
 *    document, each offering whatever that document supports
 *
 * Takes the `dokumentbeskrivelse` array rather than an entity, so the same
 * button serves a journalpost row, a search result, or anything else with
 * documents. The caller must have expanded `dokumentbeskrivelse.dokumentobjekt`.
 */
export default function DocumentActions({
  dokumentbeskrivelse,
  className,
}: {
  dokumentbeskrivelse?: readonly DokumentbeskrivelseRef[];
  className?: string;
}) {
  const t = useTranslation();

  const refs = dokumentbeskrivelse ?? [];
  const documents = refs.filter(
    (ref): ref is Dokumentbeskrivelse => typeof ref !== 'string',
  );

  // Bare ids say a document exists but nothing about its files, so there is no
  // way to tell which of the three actions applies. Render nothing rather than
  // guess — reaching this means the caller skipped the expand.
  if (refs.length > 0 && documents.length === 0) {
    return null;
  }

  const downloadable = documents.filter(
    (document) => fileOf(document) !== undefined,
  );

  let action: ReactNode;

  if (downloadable.length === 0) {
    // No files anywhere — including the case of no documents at all — so the
    // only thing on offer is asking for access.
    action = <OrderAccessButton />;
  } else if (documents.length === 1) {
    const file = fileOf(documents[0]);
    action = file ? (
      <DownloadButton file={file} label={t('journalpost.downloadDocument')} />
    ) : null;
  } else {
    action = (
      <EinDropdown
        className={styles.dropdown}
        trigger={t('journalpost.downloadDocument')}
        variant="secondary"
        showChevronDown
      >
        {documents.map((document) => {
          const file = fileOf(document);
          return file ? (
            <DownloadButton
              key={document.id}
              file={file}
              label={document.tittel}
              // The visible text is the document's own title, so spell the action
              // out for assistive tech, which cannot read it off the icon.
              ariaLabel={`${t('journalpost.downloadDocument')}: ${document.tittel}`}
              fullWidth
            />
          ) : (
            <OrderAccessButton
              key={document.id}
              label={document.tittel}
              ariaLabel={`${t('journalpost.orderAccess')}: ${document.tittel}`}
              fullWidth
            />
          );
        })}
      </EinDropdown>
    );
  }

  return (
    // Designsystemet's sizing is inherited rather than per-component:
    // `[data-size]` recomputes the `--ds-size-*` / `--ds-font-size-*` scales as
    // custom properties and sets a font-size, and `.ds-button:not([data-size])`
    // is `font-size: inherit`. Declaring it once here is therefore what reaches
    // the dropdown's trigger — EinDropdown builds that button itself and takes
    // no props for it — as well as the popup's entries, which EinPopup renders
    // inline rather than through a portal.
    <div className={cn(styles.actions, className)} data-size="sm">
      {action}
    </div>
  );
}

function DownloadButton({
  file,
  label,
  ariaLabel,
  fullWidth = false,
}: {
  file: Dokumentobjekt;
  label: string;
  ariaLabel?: string;
  fullWidth?: boolean;
}) {
  return (
    <EinButton
      asChild
      variant="secondary"
      fullWidth={fullWidth}
      className={styles.action}
    >
      {/* An absolute URL on the API host, so a plain anchor rather than EinLink,
          which would hand it to the client-side navigator. */}
      <a href={generateFileUrl(file)} aria-label={ariaLabel}>
        <DownloadIcon aria-hidden="true" />
        <span className={styles.actionLabel}>{label}</span>
      </a>
    </EinButton>
  );
}

function OrderAccessButton({
  label,
  ariaLabel,
  fullWidth = false,
}: {
  label?: string;
  ariaLabel?: string;
  fullWidth?: boolean;
}) {
  const t = useTranslation();

  return (
    // TODO: wire up the order-access flow. Inert for now, matching the same
    // placeholder button in JournalpostContainer.
    <EinButton
      variant="secondary"
      fullWidth={fullWidth}
      aria-label={ariaLabel}
      className={styles.action}
    >
      <EnvelopeClosedIcon aria-hidden="true" />
      <span className={styles.actionLabel}>
        {label ?? t('journalpost.orderAccess')}
      </span>
    </EinButton>
  );
}
