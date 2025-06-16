'use client';

import { useParams } from 'next/navigation';
import { useActionState, useState } from 'react';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinInput } from '~/components/EinInput/EinInput';
import EinModal, {
  EinModalBody,
  EinModalFooter,
  EinModalHeader,
} from '~/components/EinModal/EinModal';
import { useTranslation } from '~/hooks/useTranslation';
import { addApiKeyAction } from './page';
import { Field, Label, Select, Switch } from '@digdir/designsystemet-react';

import styles from './AddApiKeyModal.module.scss';

interface AddApiKeyModalProps {
  open: boolean;
}

export default function AddApiKeyModal({ open }: AddApiKeyModalProps) {
  const t = useTranslation();
  const [shouldExpire, setShouldExpire] = useState(false);
  const [copied, setCopied] = useState(false);
  const { enhet: enhetId } = useParams<{ enhet: string }>();
  const [addedKey, addApiKey, isPending] = useActionState(
    addApiKeyAction,
    undefined,
  );

  const copyToClipboard = async () => {
    if (addedKey?.secretKey) {
      try {
        await navigator.clipboard.writeText(addedKey.secretKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy: ', err);
      }
    }
  };

  const handleClose = () => {
    setCopied(false);
  };

  const title = addedKey
    ? t('admin.apiKey.successfullyCreatedTitle')
    : t('admin.apiKey.addApiKey');

  const body = addedKey ? (
    <>
      <p>{t('admin.apiKey.copyKeyWarning')}</p>
      <p data-size="lg">
        {t('admin.apiKey.keyName')}: <strong>{addedKey.name}:</strong>
        <br />
        <code>{addedKey.secretKey}</code>
      </p>
      <EinButton onClick={copyToClipboard} disabled={copied}>
        {t('common.copyToClipboard')}
      </EinButton>
      <EinButton onClick={handleClose}>{t('common.close')}</EinButton>
    </>
  ) : (
    <form className={styles.form} action={addApiKey}>
      <input type="hidden" name="enhetId" value={enhetId} />
      <EinInput
        name="name"
        label={t('admin.apiKey.keyName')}
        required
        disabled={isPending}
      />

      <EinInput
        name="expiresInDays"
        label={t('admin.apiKey.expiresInDays')}
        placeholder={t('admin.apiKey.expiresNever')}
        tooltip={t('admin.apiKey.expiresTooltip')}
        type="number"
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
    <EinModal className={styles.modal} open={open}>
      <EinModalHeader title={title} />
      <EinModalBody>{body}</EinModalBody>
    </EinModal>
  );
}
