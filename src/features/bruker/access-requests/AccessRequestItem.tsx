'use client';

import { ValidationMessage } from '@digdir/designsystemet-react';
import { type Innsynskrav, isJournalpost } from '@digdir/einnsyn-sdk';
import { TrashIcon } from '@navikt/aksel-icons';
import { useId, useState, useTransition } from 'react';
import { EinButton } from '~/components/EinButton/EinButton';
import styles from '~/features/bruker/saved-cases/SavedCases.module.scss';
import JournalpostResult from '~/features/search/searchresult/JournalpostResult';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
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

  return (
    <li className={styles.item}>
      <div className={styles.row}>
        <div className={styles.main}>
          {isJournalpost(innsynskrav.journalpost) ? (
            <JournalpostResult
              className={styles.result}
              item={innsynskrav.journalpost}
              titleId={titleId}
            />
          ) : (
            <h2 id={titleId} className="ds-heading" data-size="sm">
              {t('common.unnamed')}
            </h2>
          )}
          <span className={cn('ds-paragraph', styles.meta)} data-size="sm">
            {innsynskrav.sent
              ? `${t('bruker.accessRequestsPage.sentAt')} ${dateFormat(innsynskrav.sent, languageCode)}`
              : t('bruker.accessRequestsPage.notSent')}
          </span>
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
