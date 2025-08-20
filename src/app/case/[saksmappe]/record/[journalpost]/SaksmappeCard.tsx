'use client';
import type { Saksmappe } from '@digdir/einnsyn-sdk';
import { EinField } from '~/components/EinField/EinField';
import { EinLink } from '~/components/EinLink/EinLink';
import { useTranslation } from '~/hooks/useTranslation';
import { generateSaksmappeURL } from '~/lib/utils/urlGenerators';

export default function SaksmappeCard({ saksmappe }: { saksmappe: Saksmappe }) {
  const t = useTranslation();

  return (
    <div className={'ds-card__block'}>
      <EinField label={t('journalpost.connectedToCase')} />
      <EinLink
        className={'saksmappe-link'}
        href={generateSaksmappeURL(saksmappe)}
      >
        {saksmappe.offentligTittel}
      </EinLink>

      <EinField
        label={t('saksmappe.saksnummer')}
        value={saksmappe.saksnummer}
      />
      {/* Jornalpost count?*/}
    </div>
  );
}
