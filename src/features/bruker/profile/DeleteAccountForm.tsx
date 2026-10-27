'use client';

import {
  Alert,
  Card,
  Dialog,
  Heading,
  Paragraph,
} from '@digdir/designsystemet-react';
import { useActionState } from 'react';
import { EinButton } from '~/components/EinButton/EinButton';
import { useTranslation } from '~/hooks/useTranslation';
import styles from './ProfileForms.module.scss';
import { deleteAccountAction } from './profile.actions';

const DIALOG_ID = 'delete-account-dialog';

export default function DeleteAccountForm() {
  const t = useTranslation();
  const [state, formAction, isPending] = useActionState(
    deleteAccountAction,
    {},
  );

  const errorMessage =
    state.error && t(`bruker.profilePage.errors.${state.error}`);

  return (
    <Card.Block className={styles.section}>
      <Paragraph data-size="sm">
        {t('bruker.profilePage.deleteAccountDescription')}
      </Paragraph>
      <EinButton
        type="button"
        variant="secondary"
        data-color="danger"
        command="show-modal"
        commandfor={DIALOG_ID}
        data-size="sm"
      >
        {t('bruker.profilePage.deleteAccount')}
      </EinButton>
      <Dialog id={DIALOG_ID} closeButton={t('common.cancel')}>
        <Dialog.Block>
          <Heading data-size="md">
            {t('bruker.profilePage.deleteAccount')}
          </Heading>
        </Dialog.Block>
        <Dialog.Block>
          <Paragraph>{t('bruker.profilePage.deleteAccountConfirm')}</Paragraph>
        </Dialog.Block>
        {errorMessage && (
          <Dialog.Block>
            <Alert data-color="danger">{errorMessage}</Alert>
          </Dialog.Block>
        )}
        <Dialog.Block>
          <form action={formAction} className={styles.formActions}>
            <EinButton type="submit" data-color="danger" disabled={isPending}>
              {t('bruker.profilePage.deleteAccountSubmit')}
            </EinButton>
            <EinButton
              type="button"
              variant="secondary"
              command="close"
              commandfor={DIALOG_ID}
              disabled={isPending}
            >
              {t('bruker.profilePage.deleteAccountCancel')}
            </EinButton>
          </form>
        </Dialog.Block>
      </Dialog>
    </Card.Block>
  );
}
