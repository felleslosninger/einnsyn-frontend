'use client';
import type { Enhet, Saksmappe } from '@digdir/einnsyn-sdk';
import { useTranslation } from '~/hooks/useTranslation';
import { EinLink } from '~/components/EinLink/EinLink';
import { generateSaksmappeURL } from '~/lib/utils/urlGenerators';

export default function SaksmappeCard({ saksmappe }: { saksmappe: Saksmappe }) {
  const t = useTranslation();

  return (
    <div>
      <div>
        {t('Journalpost.connectedToCase')}: {saksmappe.offentligTittel}
      </div>
      <div>
        {t('saksmappe.saksnummer')}: {saksmappe.saksnummer}
      </div>
      {/* Jornalpost count?*/}
      <EinLink
        className={'saksmappe-link'}
        href={generateSaksmappeURL(saksmappe)}
      >
        {t('journalpost.goToCase')}
      </EinLink>
    </div>
  );
}
