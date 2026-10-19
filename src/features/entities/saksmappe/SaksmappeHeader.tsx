'use client';

import { isEnhet, type Saksmappe } from '@digdir/einnsyn-sdk';
import { EinLink } from '~/components/EinLink/EinLink';
import EntityHeader, {
  type EntityMetaItem,
} from '~/features/entities/common/EntityHeader';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import {
  getAncestors,
  getEnhetIdentifier,
  getName,
  type TrimmedEnhet,
} from '~/lib/enhet/enhet';
import { buildPathname } from '~/lib/routing/pathname';
import { dateFormat } from '~/lib/utils/dateFormat';
import styles from './SaksmappeHeader.module.scss';

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
    const enhetLink = (node: TrimmedEnhet) => (
      <EinLink
        href={buildPathname(
          { enhetIdentifier: getEnhetIdentifier(node) },
          languageCode,
        )}
      >
        {getName(node, languageCode)}
      </EinLink>
    );
    const chain = [...getAncestors(enhet), enhet];
    meta.push({
      label: t('saksmappe.publishedBy'),
      // A lone enhet stays a plain link: a one-item list is screen-reader noise.
      value:
        chain.length > 1 ? (
          <ol className={styles.enhetChain}>
            {chain.map((node) => (
              <li key={node.id}>{enhetLink(node)}</li>
            ))}
          </ol>
        ) : (
          enhetLink(enhet)
        ),
    });
  }

  return <EntityHeader title={saksmappe.offentligTittel} meta={meta} />;
}
