'use client';

import type { Saksmappe } from '@digdir/einnsyn-sdk';
import EntityHeader, {
  type EntityMetaItem,
} from '~/features/entities/common/EntityHeader';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
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

  return <EntityHeader title={saksmappe.offentligTittel} meta={meta} />;
}
