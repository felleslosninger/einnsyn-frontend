'use client';

import type { ApiKey } from '@digdir/einnsyn-sdk';
import { TrashIcon } from '@navikt/aksel-icons';
import { useState, useTransition } from 'react';
import { EinButton } from '~/components/EinButton/EinButton';
import EinModal, {
  EinModalBody,
  EinModalFooter,
  EinModalHeader,
} from '~/components/EinModal/EinModal';
import { useTranslation } from '~/hooks/useTranslation';
import { deleteApiKeyAction } from './actions';
import { dateFormat } from '~/lib/utils/dateFormat';
import { useLanguageCode } from '~/hooks/useLanguageCode';

import tableStyles from './AddApiKeyModal.module.scss';
import styles from './ApiKeyItem.module.scss';
import cn from '~/lib/utils/className';

interface ApiKeyItemProps {
  apiKey: ApiKey;
  removeApiKeyHandler: (keyId: string) => ApiKey | undefined;
}

export default function ApiKeyItem({
  apiKey,
  removeApiKeyHandler,
}: ApiKeyItemProps) {
  const t = useTranslation();
  const languageCode = useLanguageCode();
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  const handleDeleteClick = () => {
    setShowDeletePopup(true);
  };

  const handleCancel = () => {
    setShowDeletePopup(false);
  };

  const handleDelete = (form: FormData) => {
    startDeleteTransition(() => {
      removeApiKeyHandler(form.get('keyId') as string);
      deleteApiKeyAction(form);
      setShowDeletePopup(false);
    });
  };

  const daysTillExpiration = apiKey.expiresAt
    ? Math.ceil(
        (new Date(apiKey.expiresAt).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : Number.POSITIVE_INFINITY;
  const expiryWarning =
    daysTillExpiration <= 0
      ? 'expired'
      : daysTillExpiration < 30
        ? 'expiringSoon'
        : '';

  return (
    <>
      <div className="table-row">
        <div className="table-cell">{apiKey.name}</div>
        <div className={cn('table-cell', styles[expiryWarning])}>
          {' '}
          {apiKey.expiresAt
            ? dateFormat(apiKey.expiresAt, languageCode)
            : t('admin.apiKey.expiresNever')}
        </div>
        <div className="table-cell">
          <EinButton variant="secondary" onClick={handleDeleteClick}>
            <TrashIcon
              title={t('admin.apiKey.deleteApiKey')}
              fontSize="1.5rem"
            />
            {t('common.delete')}
          </EinButton>

          <EinModal open={showDeletePopup} setOpen={setShowDeletePopup}>
            <EinModalHeader title={t('admin.apiKey.deleteConfirmationTitle')} />
            <EinModalBody>
              <form action={handleDelete} className={tableStyles.form}>
                <div>
                  {t(
                    'admin.apiKey.deleteConfirmationMessage',
                    apiKey.name ?? t('common.unnamed'),
                  )}
                </div>
                <input type="hidden" name="action" value="delete" />
                <input type="hidden" name="keyId" value={apiKey.id} />

                <div className={tableStyles.confirmButtons}>
                  <EinButton
                    onClick={handleCancel}
                    disabled={isDeleting}
                    variant="secondary"
                  >
                    {t('common.cancel')}
                  </EinButton>
                  <EinButton
                    type="submit"
                    data-color="danger"
                    disabled={isDeleting}
                  >
                    {isDeleting ? t('common.deleting') : t('common.delete')}
                  </EinButton>
                </div>
              </form>
            </EinModalBody>
          </EinModal>
        </div>
      </div>
    </>
  );
}
