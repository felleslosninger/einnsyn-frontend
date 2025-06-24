'use client';
import type { Enhet } from '@digdir/einnsyn-sdk';
import { useTranslation } from '~/hooks/useTranslation';

export default function EnhetCard({ enhet }: { enhet: Enhet }) {
  const t = useTranslation();

  return (
    <div>
      <div>
        {t('virksomhet.label')}: {enhet.navn}
      </div>
      <div>
        {t('virksomhet.telefon')}: {enhet.kontaktpunktTelefon}
      </div>
      <div>
        {t('virksomhet.epost')}: {enhet.kontaktpunktEpost}
      </div>
      <div>
        {t('virksomhet.adresse')}: {enhet.kontaktpunktAdresse}
      </div>
    </div>
  );
}
