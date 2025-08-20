'use client';

import {
  type Enhet,
  isDokumentbeskrivelse,
  isEnhet,
  isSaksmappe,
  isSkjerming,
  type Journalpost,
} from '@digdir/einnsyn-sdk';
import EnhetCard from '~/app/case/[saksmappe]/EnhetCard';
import SaksmappeCard from '~/app/case/[saksmappe]/record/[journalpost]/SaksmappeCard';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinField } from '~/components/EinField/EinField';
import { EinLink } from '~/components/EinLink/EinLink';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { dateFormat } from '~/lib/utils/dateFormat';
import { mapJournalpostType } from '~/lib/utils/typeNameMapper';
import { generateFileUrl } from '~/lib/utils/urlGenerators';
import './journalpostContainerStyles.scss';
import { useState } from 'react';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { getFileIcon } from '~/lib/utils/getFileIcon';

export default function JournalpostContainer({
  journalpost,
}: {
  journalpost: Journalpost | null;
}) {
  const t = useTranslation();
  const languageCode = useLanguageCode();
  const [viewAllAttachments, setViewAllAttachments] = useState(false);

  const getAttatchments = () =>
    viewAllAttachments ? attatchments : attatchments.slice(0, 7);

  function toggleAttachmentDisplay() {
    setViewAllAttachments(!viewAllAttachments);
  }

  if (journalpost === null) {
    return (
      <div className="container-wrapper">
        <div className="container-pre" />
        <div className="container">
          <div>{t('journalpost.label')}</div>
          <h1>{t('journalpost.404')}</h1>
        </div>
      </div>
    );
  }

  const e = journalpost.administrativEnhetObjekt;
  let enhet: Enhet | undefined;
  if (isEnhet(e)) {
    enhet = e as Enhet;
  }

  const mainDocument = journalpost.dokumentbeskrivelse
    ?.filter((db) => typeof db !== 'string')
    .filter((db) => db.tilknyttetRegistreringSom.endsWith('hoveddokument'))
    .at(0);

  const attatchments =
    journalpost.dokumentbeskrivelse
      ?.filter((db) => typeof db !== 'string')
      .filter((db) => db.tilknyttetRegistreringSom.endsWith('vedlegg'))
      .map((attachment) =>
        // if dokObj: show links to all variants
        // else: show unpublished-message
        {
          return (
            <div key={attachment.id} className={'attachment ds-card__block'}>
              <span className={'attachment-title'}>{attachment.tittel}</span>
              {attachment.dokumentobjekt &&
                attachment.dokumentobjekt.length > 0 &&
                attachment.dokumentobjekt
                  ?.filter((dob) => typeof dob !== 'string')
                  .map((dob) => (
                    <EinLink
                      href={generateFileUrl(dob)}
                      key={dob.id}
                      className={''}
                    >
                      {getFileIcon(dob.format)}
                      {`(${dob.format})`}
                    </EinLink>
                  ))}
              {!attachment.dokumentobjekt ||
                (attachment.dokumentobjekt.length === 0 && (
                  <span
                    key={attachment.id}
                  >{`${attachment.tittel} (${t('journalpost.notPublished')})`}</span>
                ))}
            </div>
          );
        },
      ) ?? [];

  function determineKorrparts() {
    if (journalpost?.journalposttype === 'inngaaende_dokument') {
      return (journalpost.korrespondansepart ?? [])
        .filter((k) => typeof k !== 'string')
        .filter((k) => /^[Aa]vsender$/.test(k.korrespondanseparttype))
        .map((k) => k.korrespondansepartNavnSensitiv)
        .join(', ');
    } else if (journalpost?.journalposttype === 'utgaaende_dokument') {
      return (journalpost.korrespondansepart ?? [])
        .filter((k) => typeof k !== 'string')
        .filter((k) => /^[Mm]ottaker$/.test(k.korrespondanseparttype))
        .map((k) => k.korrespondansepartNavnSensitiv)
        .join(', ');
    } else {
      return t('common.unnamed');
    }
  }

  return (
    <div className="container-wrapper">
      <div className="container-pre" />
      <div className="container">
        <div>{t('journalpost.label')}</div>
        <h1>{journalpost.offentligTittel}</h1>
        <div
          className={cn('two-col-card', 'ds-card')}
          data-variant={'tinted'}
          data-color={'brand3'}
        >
          {/*
      todo
       bestill-knapp
      */}
          <EinField
            label={t('journalpost.docNumber')}
            value={journalpost.journalpostnummer.toString()}
          />
          {journalpost.journalposttype === 'utgaaende_dokument' && (
            <EinField
              label={t('journalpost.to')}
              value={determineKorrparts()}
            />
          )}
          {journalpost.journalposttype === 'inngaaende_dokument' && (
            <EinField
              label={t('journalpost.from')}
              value={determineKorrparts()}
            />
          )}
          <EinField
            label={t('journalpost.recordType')}
            value={mapJournalpostType(journalpost.journalposttype)}
          />
          <EinField
            label={t('journalpost.docDate')}
            value={
              journalpost.dokumentetsDato
                ? dateFormat(journalpost.dokumentetsDato, languageCode)
                : ''
            }
          />
          <EinField
            label={t('journalpost.recordDate')}
            value={dateFormat(journalpost.journaldato ?? '', languageCode)}
          />
          <EinField
            label={t('common.publishedAt')}
            value={dateFormat(journalpost.publisertDato ?? '', languageCode)}
          />
          <EinField
            label={t('common.updatedAt')}
            value={dateFormat(journalpost.oppdatertDato ?? '', languageCode)}
          />
          {isSkjerming(journalpost.skjerming) && (
            <EinField
              label={t('journalpost.legalBasis')}
              value={journalpost.skjerming.skjermingshjemmel ?? ''}
            />
          )}
        </div>
        {isDokumentbeskrivelse(mainDocument) && mainDocument.dokumentobjekt && (
          <div className={cn('main-document', 'ds-card')}>
            <h2>{mainDocument.tittel}</h2>
            {mainDocument.dokumentobjekt
              .filter((dob) => typeof dob !== 'string')
              .map((dob) => (
                <EinLink key={dob.id} href={generateFileUrl(dob)}>
                  {getFileIcon(dob.format)}
                  {`(${dob.format})`}
                </EinLink>
              ))}
            {mainDocument.dokumentobjekt.length === 0 && (
              // TODO: implement
              <EinButton>Order main document</EinButton>
            )}
          </div>
        )}
        {attatchments.length > 0 && (
          <div className={cn('attachment-list', 'ds-card')}>
            <div className={'ds-card__block'}>
              <h2>{`${t('journalpost.attachmentPlural')} (${attatchments.length})`}</h2>
            </div>
            {getAttatchments()}
            {attatchments.length > 7 && (
              <EinButton onClick={toggleAttachmentDisplay}>
                {viewAllAttachments ? 'Collapse' : 'Expand'}
              </EinButton>
            )}
          </div>
        )}
        <div
          className={cn('two-col-card', 'ds-card')}
          data-variant={'tinted'}
          data-color={'accent'}
        >
          {isSaksmappe(journalpost.saksmappe) && (
            <SaksmappeCard saksmappe={journalpost.saksmappe} />
          )}
          <div className={cn('enhet-info', 'ds-card__block')}>
            {enhet && <EnhetCard enhet={enhet} />}
          </div>
        </div>
      </div>
      <div className="container-post" />
    </div>
  );
}
