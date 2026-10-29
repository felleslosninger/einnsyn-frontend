'use client';

import { ValidationMessage } from '@digdir/designsystemet-react';
import {
  type Innsynskrav,
  isEnhet,
  isJournalpost,
  isSaksmappe,
} from '@digdir/einnsyn-sdk';
import { TrashIcon } from '@navikt/aksel-icons';
import { useId, useState, useTransition } from 'react';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinLink } from '~/components/EinLink/EinLink';
import styles from '~/features/bruker/saved-cases/SavedCases.module.scss';
import EnhetLink from '~/features/search/searchresult/common/EnhetLink';
import SearchResultSubheader from '~/features/search/searchresult/common/SearchResultSubheader';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import { getEnhetIdentifier } from '~/lib/enhet/enhet';
import { buildPathname } from '~/lib/routing/pathname';
import cn from '~/lib/utils/className';
import { dateFormat } from '~/lib/utils/dateFormat';
import { deleteInnsynskrav } from './innsynskrav.actions';

export function AccessRequestItem({
  innsynskrav,
  onDelete,
}: {
  innsynskrav: Innsynskrav;
  onDelete: (id: string) => void;
}) {
  const t = useTranslation();
  const languageCode = useLanguageCode();
  const titleId = useId();
  const [error, setError] = useState<string>();
  const [isDeleting, startDeleteTransition] = useTransition();

  const handleDelete = () => {
    setError(undefined);
    startDeleteTransition(async () => {
      const ok = await deleteInnsynskrav(innsynskrav.id);
      if (ok) {
        onDelete(innsynskrav.id);
      } else {
        setError(t('bruker.accessRequestsPage.deleteError'));
      }
    });
  };

  const journalpost = innsynskrav.journalpost;
  const saksmappe = isJournalpost(journalpost)
    ? journalpost.saksmappe
    : undefined;
  const enhet = isJournalpost(journalpost)
    ? journalpost.administrativEnhetObjekt
    : undefined;
  const href =
    isJournalpost(journalpost) && isSaksmappe(saksmappe) && isEnhet(enhet)
      ? buildPathname(
          {
            enhetIdentifier: getEnhetIdentifier(enhet),
            saksmappeIdentifier: saksmappe.id,
            journalpostIdentifier: journalpost.id,
          },
          languageCode,
        )
      : '';

  return (
    <li className={styles.item}>
      <div className={styles.row}>
        <div className={styles.main}>
          <EinLink
            id={titleId}
            href={href}
            className={cn('ds-heading', styles.title)}
          >
            {isJournalpost(journalpost)
              ? journalpost.offentligTittel
              : t('common.unnamed')}
          </EinLink>
          <div className={cn('ds-paragraph', styles.metaStack)} data-size="sm">
            {isJournalpost(journalpost) && (
              <SearchResultSubheader
                variant="journalpost"
                item={journalpost}
                label={t('journalpost.label')}
              >
                {isSaksmappe(saksmappe) && (
                  <span>
                    {t('common.number')} {saksmappe.saksnummer}
                  </span>
                )}
                {journalpost.journalposttype && (
                  <span>
                    {t(`journalpost.type.${journalpost.journalposttype}`)}
                  </span>
                )}
                {journalpost.journaldato && (
                  <span>
                    {t('common.recordedAt')}{' '}
                    {dateFormat(journalpost.journaldato, languageCode)}
                  </span>
                )}
              </SearchResultSubheader>
            )}
            {innsynskrav.enhet && (
              <div>
                <EnhetLink enhet={innsynskrav.enhet} withAncestors={false} />
              </div>
            )}
            <div>
              {innsynskrav.sent
                ? `${t('bruker.accessRequestsPage.sentAt')} ${dateFormat(innsynskrav.sent, languageCode)}`
                : t('bruker.accessRequestsPage.notSent')}
            </div>
          </div>
        </div>
        <div className={styles.actions}>
          <EinButton
            variant="tertiary"
            data-size="sm"
            disabled={isDeleting}
            aria-describedby={titleId}
            onClick={handleDelete}
          >
            <TrashIcon aria-hidden />
            {t('common.delete')}
          </EinButton>
        </div>
      </div>
      {error && (
        <ValidationMessage data-size="sm" role="alert">
          {error}
        </ValidationMessage>
      )}
    </li>
  );
}
