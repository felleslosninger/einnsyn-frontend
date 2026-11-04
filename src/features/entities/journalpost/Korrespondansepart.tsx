'use client';

import { type Enhet, isEnhet, type Journalpost } from '@digdir/einnsyn-sdk';
import { EinLink } from '~/components/EinLink/EinLink';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useSearchHref } from '~/hooks/useSearchHref';
import { useTranslation } from '~/hooks/useTranslation';
import { getEnhetIdentifier, getName } from '~/lib/enhet/enhet';
import cn from '~/lib/utils/className';
import styles from './Korrespondansepart.module.scss';

const PARTY_TYPE_PATTERNS = {
  avsender: /^[Aa]vsender$/,
  mottaker: /^[Mm]ottaker$/,
};

/** The names of a journalpost's senders or receivers, in the API's order. */
export function partyNames(
  journalpost: Journalpost,
  role: keyof typeof PARTY_TYPE_PATTERNS,
): string[] {
  return (journalpost.korrespondansepart ?? [])
    .filter((k) => typeof k !== 'string')
    .filter((k) => PARTY_TYPE_PATTERNS[role].test(k.korrespondanseparttype))
    .map((k) => k.korrespondansepartNavnSensitiv)
    .filter((navn): navn is string => Boolean(navn));
}

export function Korrespondansepart({
  journalpost,
  enhet = journalpost.administrativEnhetObjekt,
  className,
}: {
  journalpost: Journalpost;
  // The case list's payload leaves `administrativEnhetObjekt` unexpanded, so
  // that caller passes the saksmappe's enhet instead.
  enhet?: Enhet | string;
  className?: string;
}) {
  const t = useTranslation();
  const languageCode = useLanguageCode();
  const searchHref = useSearchHref();

  if (!isEnhet(enhet)) {
    return null;
  }

  const enhetNavn = getName(enhet, languageCode);
  const enhetHref = searchHref({ enhet: [getEnhetIdentifier(enhet)] });
  const from = t('journalpost.from');
  const to = t('journalpost.to');
  const isIncoming = journalpost.journalposttype === 'inngaaende_dokument';
  const isOutgoing = journalpost.journalposttype === 'utgaaende_dokument';
  const enhetNode = (
    <EinLink href={enhetHref} className={styles.party}>
      {enhetNavn}
    </EinLink>
  );

  return (
    <div className={cn(styles.korr, className)}>
      {isIncoming && (
        <>
          <span className={styles.direction}>{to}: </span>
          {enhetNode} <span className={styles.direction}>{from}: </span>
          <PartyNameList names={partyNames(journalpost, 'avsender')} />
        </>
      )}
      {isOutgoing && (
        <>
          <span className={styles.direction}>{from}: </span>
          {enhetNode} <span className={styles.direction}>{to}: </span>
          <PartyNameList names={partyNames(journalpost, 'mottaker')} />
        </>
      )}
      {!isIncoming && !isOutgoing && enhetNode}
    </div>
  );
}

function PartyNameList({ names }: { names: string[] }) {
  const t = useTranslation();

  if (names.length === 0) {
    return null;
  }

  const [first, ...rest] = names;
  return (
    <span className={styles.party}>
      {first}
      {rest.length > 0 && (
        <span> {t('common.andMore', String(rest.length))}</span>
      )}
    </span>
  );
}
