'use client';

import type { Journalpost } from '@digdir/einnsyn-sdk';
import { EinLink } from '~/components/EinLink/EinLink';
import { generateJournalpostURL } from '~/lib/utils/urlGenerators';

function formatDate(date: string | undefined) {
  if (!date) return '';
  const d = new Date(date);
  return new Intl.DateTimeFormat('no-nb').format(d);
}

export default function JournalpostRow({
  journalpost,
}: { journalpost: Journalpost }) {
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
      <td className={'table-cell'}>{formatDate(journalpost.journaldato)}</td>
      <td className={'table-cell'}>{formatDate(journalpost.publisertDato)}</td>
    </tr>
  );
}
