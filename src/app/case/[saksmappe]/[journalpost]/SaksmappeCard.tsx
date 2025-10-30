'use client';
import type { Saksmappe } from '@digdir/einnsyn-sdk';
import { LabeledField } from '~/app/case/[saksmappe]/LabeledField';
import { EinLink } from '~/components/EinLink/EinLink';
import { useTranslation } from '~/hooks/useTranslation';
import { generateSaksmappeURL } from '~/lib/utils/urlGenerators';

export default function SaksmappeCard({ saksmappe }: { saksmappe: Saksmappe }) {
  const t = useTranslation();

  return (
    <div className={'ds-card__block'}>
      <LabeledField label={t('journalpost.connectedToCase')} />
      <EinLink
        className={'saksmappe-link'}
        href={generateSaksmappeURL(saksmappe)}
      >
        {saksmappe.offentligTittel}
      </EinLink>

      <LabeledField
        label={t('saksmappe.saksnummer')}
        value={saksmappe.saksnummer}
      />
      {/* Jornalpost count?*/}
    </div>
  );
}
