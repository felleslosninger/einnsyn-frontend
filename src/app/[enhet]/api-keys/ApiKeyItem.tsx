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
import { deleteApiKeyAction } from './page';

interface ApiKeyItemProps {
  apiKey: ApiKey;
}

export default function ApiKeyItem({ apiKey }: ApiKeyItemProps) {
  const t = useTranslation();
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
      deleteApiKeyAction(form);
    });
  };

  return (
    <>
      <tr>
        <td>{apiKey.name}</td>
        <td>{apiKey.expiresAt ?? t('admin.apiKey.expiresNever')}</td>
        <td>
          <EinButton style="link" onClick={handleDeleteClick}>
            <TrashIcon title="a11y-title" fontSize="1.5rem" />
          </EinButton>
        </td>
      </tr>

      <EinModal open={showDeletePopup}>
        <EinModalHeader title={t('admin.apiKey.deleteConfirmationTitle')} />
        <EinModalBody>
          <p>
            {t(
              'admin.apiKey.deleteConfirmationMessage',
              apiKey.name ?? t('common.unnamed'),
            )}
          </p>
        </EinModalBody>
        <EinModalFooter>
          <form action={handleDelete}>
            <input type="hidden" name="action" value="delete" />
            <input type="hidden" name="keyId" value={apiKey.id} />
            <EinButton onClick={handleCancel} disabled={isDeleting}>
              {t('common.cancel')}
            </EinButton>
            <EinButton type="submit" data-color="danger" disabled={isDeleting}>
              {isDeleting ? t('common.deleting') : t('common.delete')}
            </EinButton>
          </form>
        </EinModalFooter>
      </EinModal>
    </>
  );
}
