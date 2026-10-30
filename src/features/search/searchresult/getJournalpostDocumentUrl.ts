import {
  isDokumentbeskrivelse,
  isDokumentobjekt,
  type Journalpost,
} from '@digdir/einnsyn-sdk';

export function getJournalpostDocumentUrl(
  journalpost: Pick<Journalpost, 'dokumentbeskrivelse'>,
): string | undefined {
  for (const description of journalpost.dokumentbeskrivelse ?? []) {
    if (!isDokumentbeskrivelse(description)) {
      continue;
    }

    for (const document of description.dokumentobjekt ?? []) {
      if (isDokumentobjekt(document) && document.url) {
        return document.url;
      }
    }
  }

  return undefined;
}
