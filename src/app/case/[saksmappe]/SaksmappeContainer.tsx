'use client';

import {
  type Enhet,
  type Journalpost,
  type PaginatedList,
  type Saksmappe,
  isEnhet,
} from '@digdir/einnsyn-sdk';
import JournalpostList from '~/app/case/[saksmappe]/JournalpostList';
import { useTranslation } from '~/hooks/useTranslation';
import EnhetCard from '~/app/case/[saksmappe]/EnhetCard';

export default function saksmappeContainer({
  saksmappe,
  journalpostList,
}: { saksmappe: Saksmappe; journalpostList: PaginatedList<Journalpost> }) {
  const t = useTranslation();

  const e = saksmappe.administrativEnhetObjekt;
  let enhet: Enhet | undefined;
  if (isEnhet(e)) {
    enhet = e as Enhet;
  }

  return (
    <>
      <h1>{saksmappe.offentligTittel}</h1>
      <div>
        <div>
          <div>
            {t('saksmappe.saksnummer')}: {saksmappe.saksnummer}
          </div>
        </div>
        {enhet && <EnhetCard enhet={enhet} />}
      </div>
      <JournalpostList journalposts={journalpostList} />
    </>
  );
}
