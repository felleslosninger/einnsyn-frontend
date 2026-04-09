'use client';

import { isSkjerming, type Journalpost } from '@digdir/einnsyn-sdk';
import { Fragment } from 'react/jsx-runtime';
import { EinLink } from '~/components/EinLink/EinLink';
import { useTranslation } from '~/hooks/useTranslation';
import { mapJournalpostType } from '~/lib/utils/typeNameMapper';
import { generateJournalpostURL } from '~/lib/utils/urlGenerators';
import styles from './JournalpostRow.module.scss';

function formatDate(date: string | undefined) {
  if (!date) return '';
  const d = new Date(date);
  return new Intl.DateTimeFormat('no-nb').format(d);
}

function determineKorrparts(journalpost: Journalpost) {
  const t = useTranslation();
  if (journalpost.journalposttype === 'inngaaende_dokument') {
    return (
      <>
        <span className={styles.korrpartDirection}>
          {t('journalpost.from')}
        </span>
        {(journalpost.korrespondansepart ?? [])
          .filter((k) => typeof k !== 'string')
          .filter((k) => /^[Aa]vsender$/.test(k.korrespondanseparttype))
          .map((k) => (
            <Fragment key={k.id}>{k.korrespondansepartNavnSensitiv}</Fragment>
          ))}
      </>
    );
  } else if (journalpost.journalposttype === 'utgaaende_dokument') {
    return (
      <>
        <span className={styles.korrpartDirection}>{t('journalpost.to')}</span>
        {(journalpost.korrespondansepart ?? [])
          .filter((k) => typeof k !== 'string')
          .filter((k) => /^[Mm]ottaker$/.test(k.korrespondanseparttype))
          .map((k) => (
            <Fragment key={k.id}>{k.korrespondansepartNavnSensitiv}</Fragment>
          ))}
      </>
    );
  }
}

export default function JournalpostRow({
  journalpost,
}: {
  journalpost: Journalpost;
}) {
  return (
    <tr className="table-row">
      <td className={'table-cell'}>
        <EinLink
          className={'journalpost-link'}
          href={generateJournalpostURL(journalpost)}
        >
          {journalpost.offentligTittel}
        </EinLink>
      </td>
      <td className={'table-cell'}>{journalpost.journalpostnummer}</td>
      <td className={'table-cell'}>{determineKorrparts(journalpost)}</td>
      <td className={'table-cell'}>
        {mapJournalpostType(journalpost.journalposttype)}
      </td>
      <td className={'table-cell'}>
        {formatDate(journalpost.dokumentetsDato)}
      </td>
      <td className={'table-cell'}>{formatDate(journalpost.journaldato)}</td>
      <td className={'table-cell'}>{formatDate(journalpost.publisertDato)}</td>
      <td className={'table-cell'}>
        {isSkjerming(journalpost.skjerming) &&
          journalpost.skjerming.skjermingshjemmel}
      </td>
      <td className={'table-cell'}>TODO: actions</td>
    </tr>
  );
}
