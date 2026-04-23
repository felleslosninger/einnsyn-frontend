'use client';
import type { Enhet } from '@digdir/einnsyn-sdk';
import { EinLink } from '~/components/EinLink/EinLink';
import { LabeledField } from '~/features/entities/saksmappe/LabeledField';
import { useTranslation } from '~/hooks/useTranslation';
import { generateEnhetUrl } from '~/lib/utils/urlGenerators';

export default function EnhetCard({ enhet }: { enhet: Enhet }) {
  const t = useTranslation();

  return (
    <div className={'enhetCard'}>
      <LabeledField label={t('virksomhet.label')}>
        <EinLink className={'enhet-link'} href={generateEnhetUrl(enhet)}>
          {enhet.navn}
        </EinLink>
      </LabeledField>
      <LabeledField
        label={t('virksomhet.telefon')}
        value={enhet.kontaktpunktTelefon ?? ''}
      ></LabeledField>
      <LabeledField
        label={t('virksomhet.epost')}
        value={enhet.kontaktpunktEpost ?? ''}
      ></LabeledField>
      <LabeledField
        label={t('virksomhet.adresse')}
        value={enhet.kontaktpunktAdresse ?? ''}
      ></LabeledField>
    </div>
  );
}
