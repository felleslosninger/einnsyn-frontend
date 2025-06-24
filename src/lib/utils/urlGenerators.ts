import { isSaksmappe, Journalpost, Saksmappe } from '@digdir/einnsyn-sdk';
import { useTranslation } from '~/hooks/useTranslation';

export function generateSaksmappeURL(saksmappe: Saksmappe): string {
  const t = useTranslation();
  return `/${t('routing.saksmappePath')}/${saksmappe.id}`;
}

export function generateJournalpostURL(journalpost: Journalpost): string {
  const t = useTranslation();
  let saksmappe: string;
  if (isSaksmappe(journalpost.saksmappe)) {
    saksmappe = journalpost.saksmappe.id;
  } else {
    saksmappe = journalpost.saksmappe;
  }
  return `/${t('routing.saksmappePath')}/${saksmappe}/${t('journalpost.pathName')}/${journalpost.id}`;
}
