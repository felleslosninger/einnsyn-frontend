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

export type PartyType = keyof typeof PARTY_TYPE_PATTERNS;
export type Party = { id: string; name: string };

/** A journalpost's senders or receivers, in the API's order. */
export function getParties(journalpost: Journalpost, type: PartyType): Party[] {
  return (journalpost.korrespondansepart ?? [])
    .filter((k) => typeof k !== 'string')
    .filter((k) => PARTY_TYPE_PATTERNS[type].test(k.korrespondanseparttype))
    .map((k) => ({ id: k.id, name: k.korrespondansepartNavnSensitiv }))
    .filter((party): party is Party => Boolean(party.name));
}

/** The names of a journalpost's senders or receivers, in the API's order. */
export function partyNames(
  journalpost: Journalpost,
  type: PartyType,
): string[] {
  return getParties(journalpost, type).map((party) => party.name);
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
    <EinLink href={enhetHref} className={styles.name}>
      {enhetNavn}
    </EinLink>
  );

  return (
    <div className={cn(styles.korr, className)}>
      {isIncoming && (
        <>
          <Part label={to}>{enhetNode}</Part>
          <PartyNameList
            label={from}
            names={partyNames(journalpost, 'avsender')}
          />
        </>
      )}
      {isOutgoing && (
        <>
          <Part label={from}>{enhetNode}</Part>
          <PartyNameList
            label={to}
            names={partyNames(journalpost, 'mottaker')}
          />
        </>
      )}
      {!isIncoming && !isOutgoing && <Part>{enhetNode}</Part>}
    </div>
  );
}

function Part({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={styles.part}>
      {label && <span className={styles.direction}>{label}:</span>}
      {children}
    </span>
  );
}

function PartyNameList({ label, names }: { label: string; names: string[] }) {
  const t = useTranslation();

  if (names.length === 0) {
    return null;
  }

  const [first, ...rest] = names;
  return (
    <Part label={label}>
      <span className={styles.name}>{first}</span>
      {rest.length > 0 && (
        <span>{t('common.andMore', String(rest.length))}</span>
      )}
    </Part>
  );
}
