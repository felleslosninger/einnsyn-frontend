'use client';

import { useTranslation } from '~/hooks/useTranslation';
import { isEnhet, type Enhet, type Journalpost } from '@digdir/einnsyn-sdk';
import EnhetCard from '~/app/case/[saksmappe]/EnhetCard';
import SaksmappeCard from '~/app/case/[saksmappe]/record/[journalpost]/SaksmappeCard';

export default function journalpostContainer({
  journalpost,
}: { journalpost: Journalpost }) {
  const t = useTranslation();

  const e = journalpost.administrativEnhetObjekt;
  let enhet: Enhet | undefined;
  if (isEnhet(e)) {
    enhet = e as Enhet;
  }

  return (
    <div>
      <div>{t('journalpost.label')}</div>
      <h1>{journalpost.offentligTittel}</h1>
      <div className={'jp-meta'}>
        {/*
      todo
       doknr
       frå/til
       type
       dokdato
       journaldato
       publisertdato
       heimel
       bestill-knapp
      */}
      </div>
      <div className={'jp-attachments'} />
      <div className={'jp-case'} />
      <SaksmappeCard saksmappe={journalpost.saksmappe} />

      {enhet && <EnhetCard enhet={enhet} />}
      {/*
        todo:
         - list JP details,
         - attachments
         - case
         - organization
      */}
    </div>
  );
}
