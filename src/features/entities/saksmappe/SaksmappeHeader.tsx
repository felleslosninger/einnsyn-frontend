'use client';

import { isEnhet, type Saksmappe } from '@digdir/einnsyn-sdk';
import { EinLink } from '~/components/EinLink/EinLink';
import EntityHeader, {
  type EntityMetaItem,
} from '~/features/entities/common/EntityHeader';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import { getEnhetIdentifier, getName } from '~/lib/enhet/enhet';
import { buildPathname } from '~/lib/routing/pathname';
import { dateFormat } from '~/lib/utils/dateFormat';

/** Which of a saksmappe's fields the shared entity header shows, and in what order. */
export default function SaksmappeHeader({
  saksmappe,
}: {
  saksmappe: Saksmappe;
}) {
  const t = useTranslation();
  const languageCode = useLanguageCode();

  const meta: EntityMetaItem[] = [
    { label: t('saksmappe.saksnummer'), value: saksmappe.saksnummer },
  ];

  if (saksmappe.saksdato) {
    meta.push({
      label: t('saksmappe.journalfoert'),
      value: dateFormat(saksmappe.saksdato, languageCode),
    });
  }

  if (saksmappe.publisertDato) {
    meta.push({
      label: t('common.publishedAt'),
      value: dateFormat(saksmappe.publisertDato, languageCode),
    });
  }

  const enhet = saksmappe.administrativEnhetObjekt;
  if (isEnhet(enhet)) {
    meta.push({
      label: t('saksmappe.publishedBy'),
      value: (
        <EinLink
          href={buildPathname(
            { enhetIdentifier: getEnhetIdentifier(enhet) },
            languageCode,
          )}
        >
          {getName(enhet, languageCode)}
        </EinLink>
      ),
    });
  }

  return <EntityHeader title={saksmappe.offentligTittel} meta={meta} />;
}
