'use client';
import type { Enhet } from '@digdir/einnsyn-sdk';
import { EinField } from '~/components/EinField/EinField';
import { EinLink } from '~/components/EinLink/EinLink';
import { useTranslation } from '~/hooks/useTranslation';
import { generateEnhetUrl } from '~/lib/utils/urlGenerators';

export default function EnhetCard({ enhet }: { enhet: Enhet }) {
  const t = useTranslation();

  return (
    <div className={'enhetCard'}>
      <EinField label={t('virksomhet.label')}>
        <EinLink className={'enhet-link'} href={generateEnhetUrl(enhet)}>
          {enhet.navn}
        </EinLink>
      </EinField>
      <EinField
        label={t('virksomhet.telefon')}
        value={enhet.kontaktpunktTelefon ?? ''}
      ></EinField>
      <EinField
        label={t('virksomhet.epost')}
        value={enhet.kontaktpunktEpost ?? ''}
      ></EinField>
      <EinField
        label={t('virksomhet.adresse')}
        value={enhet.kontaktpunktAdresse ?? ''}
      ></EinField>
    </div>
  );
}
