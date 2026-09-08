'use client';

import {
  Alert,
  Dialog,
  Heading,
  Paragraph,
} from '@digdir/designsystemet-react';
import { useActionState } from 'react';
import { EinButton } from '~/components/EinButton/EinButton';
import { deleteAccountAction } from '~/features/bruker/profile/brukerActions';
import { useTranslation } from '~/hooks/useTranslation';
import styles from './ProfileForms.module.scss';

const DIALOG_ID = 'deactivate-account-dialog';

export default function DeactivateAccountSection() {
  const t = useTranslation();
  const [state, formAction] = useActionState(deleteAccountAction, {});

  return (
    <section className={styles.section}>
      <Heading level={2} className="ds-heading" data-size="sm">
        {t('bruker.profilePage.deactivateAccount')}
      </Heading>
      <Paragraph>
        {t('bruker.profilePage.deactivateAccountDescription')}
      </Paragraph>
      {state.error && (
        <Alert data-color="danger">
          {t(`bruker.profilePage.errors.${state.error}`) ||
            t('bruker.profilePage.deactivateAccountError')}
        </Alert>
      )}
      <EinButton
        type="button"
        style="destructive"
        variant="secondary"
        data-color="danger"
        command="show-modal"
        commandfor={DIALOG_ID}
      >
        {t('bruker.profilePage.deactivateAccount')}
      </EinButton>
      <Dialog id={DIALOG_ID} closeButton={t('common.cancel')}>
        <Dialog.Block>
          <Heading data-size="md">
            {t('bruker.profilePage.deactivateAccount')}
          </Heading>
        </Dialog.Block>
        <Dialog.Block>
          <Paragraph>
            {t('bruker.profilePage.deactivateAccountConfirm')}
          </Paragraph>
        </Dialog.Block>
        <Dialog.Block>
          <form action={formAction} className={styles.confirmActions}>
            <EinButton type="submit" variant="primary" data-color="danger">
              {t('bruker.profilePage.deactivateAccountSubmit')}
            </EinButton>
            <EinButton
              type="button"
              variant="secondary"
              command="close"
              commandfor={DIALOG_ID}
            >
              {t('bruker.profilePage.deactivateAccountCancel')}
            </EinButton>
          </form>
        </Dialog.Block>
      </Dialog>
    </section>
  );
}
