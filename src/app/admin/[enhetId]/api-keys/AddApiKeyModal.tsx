'use client';

import { Alert } from '@digdir/designsystemet-react';
import type { ApiKey } from '@digdir/einnsyn-sdk';
import { useParams } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinCheckbox } from '~/components/EinCheckbox/EinCheckbox';
import { EinInput } from '~/components/EinInput/EinInput';
import EinModal, {
  EinModalBody,
  EinModalHeader,
} from '~/components/EinModal/EinModal';
import useIsChanged from '~/hooks/useIsChanged';
import { useTranslation } from '~/hooks/useTranslation';
import styles from './AddApiKeyModal.module.scss';
import { addApiKeyAction } from './actions';

interface AddApiKeyModalProps {
  open: boolean;
  setOpen?: (open: boolean) => void;
  addApiKeyHandler: (apiKey: ApiKey) => void;
}

export default function AddApiKeyModal({
  open,
  setOpen,
  addApiKeyHandler,
}: AddApiKeyModalProps) {
  const t = useTranslation();
  const { enhetId } = useParams<{ enhetId: string }>() ?? {};
  const [addedKey, addApiKey, isPending] = useActionState(
    addApiKeyAction,
    undefined,
  );
  const [isKeyCopied, setIsKeyCopied] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const hasNewKey = useIsChanged([addedKey]) && !!addedKey;

  useEffect(() => {
    if (hasNewKey) {
      setShowSuccessMessage(true);
      addApiKeyHandler(addedKey);
    }
  }, [hasNewKey, addApiKeyHandler, addedKey]);

  const handleClose = () => {
    setOpen?.(false);
    setIsKeyCopied(false);
    setShowSuccessMessage(false);
  };

  const title = showSuccessMessage
    ? t('admin.apiKey.createdApiKeyTitle')
    : t('admin.apiKey.addApiKey');

  const body =
    addedKey && showSuccessMessage ? (
      <div className={styles.form}>
        <Alert data-color="warning">{t('admin.apiKey.copyKeyWarning')}</Alert>

        <EinInput
          label={t('admin.apiKey.keyName')}
          type="text"
          value={addedKey.name}
          readOnly
        />

        <EinInput
          label={t('admin.apiKey.secretKey')}
          copyToClipboard
          readOnly
          autoComplete="off"
          value={addedKey.secretKey}
          className={styles.secretKeyInput}
        />

        <EinCheckbox
          label={t('admin.apiKey.copyKeyConfirmation')}
          name="keyCopied"
          checked={isKeyCopied}
          onChange={(e) => setIsKeyCopied(e.target.checked)}
        />

        <EinButton onClick={handleClose} disabled={!isKeyCopied}>
          {t('common.close')}
        </EinButton>
      </div>
    ) : (
      <form className={styles.form} action={addApiKey}>
        <input type="hidden" name="enhetId" value={enhetId} />
        <EinInput
          name="name"
          label={t('admin.apiKey.keyName')}
          tooltip={t('admin.apiKey.keyNameTooltip')}
          required
          disabled={isPending}
        />

        <EinInput
          name="expiresInDays"
          label={t('admin.apiKey.expiresInDays')}
          placeholder={t('admin.apiKey.expiresNever')}
          tooltip={t('admin.apiKey.expiresTooltip')}
          type="number"
          min={1}
          disabled={isPending}
        />

        <div className={styles.confirmButtons}>
          <EinButton
            onClick={handleClose}
            disabled={isPending}
            variant="secondary"
          >
            {t('common.cancel')}
          </EinButton>
          <EinButton type="submit" disabled={isPending}>
            {isPending ? t('common.creating') : t('common.create')}
          </EinButton>
        </div>
      </form>
    );

  return (
    <EinModal className={styles.modal} open={open} setOpen={setOpen}>
      <EinModalHeader title={title} />
      <EinModalBody>{body}</EinModalBody>
    </EinModal>
  );
}
