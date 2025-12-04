'use client';

import {
  type Enhet,
  isEnhet,
  type Journalpost,
  type PaginatedList,
  type Saksmappe,
} from '@digdir/einnsyn-sdk';
import EnhetCard from '~/features/entities/saksmappe/EnhetCard';
import JournalpostList from '~/features/entities/saksmappe/JournalpostList';
import { LabeledField } from '~/features/entities/saksmappe/LabeledField';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import styles from './SaksmappeContainer.module.scss';

function formatDate(date: string | undefined) {
  if (!date) return '';
  const d = new Date(date);
  return new Intl.DateTimeFormat('no-nb').format(d);
}

export default function SaksmappeContainer({
  saksmappe,
  journalpostList,
}: {
  saksmappe: Saksmappe;
  journalpostList: PaginatedList<Journalpost>;
}) {
  const t = useTranslation();

  const e = saksmappe.administrativEnhetObjekt;
  let enhet: Enhet | undefined;
  if (isEnhet(e)) {
    enhet = e;
  }

  return (
    <div className="container-wrapper">
      <div className="container-pre" />
      <div className="container">
        <h1>{saksmappe.offentligTittel}</h1>
        <div className={cn(styles.saksmappe, 'ds-card')}>
          <div className={cn(styles.saksmappeInfo, 'ds-card__block')}>
            <div className={'saksmappe-card'}>
              <LabeledField
                label={t('saksmappe.saksnummer')}
                value={saksmappe.saksnummer}
              />
              <LabeledField
                label={t('common.publishedAt')}
                value={formatDate(saksmappe.publisertDato)}
              />
              <LabeledField
                label={t('common.updatedAt')}
                value={formatDate(saksmappe.oppdatertDato)}
              />
              {/* todo: Add counter? */}
            </div>
          </div>
          <div className={cn(styles.enhetInfo, 'ds-card__block')}>
            {enhet && <EnhetCard enhet={enhet} />}
          </div>
        </div>
        <JournalpostList journalposts={journalpostList} />
      </div>
      <div className="container-post" />
    </div>
  );
}
