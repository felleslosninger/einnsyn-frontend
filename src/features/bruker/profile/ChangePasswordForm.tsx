'use client';

import { Alert } from '@digdir/designsystemet-react';
import { useActionState } from 'react';
import { updatePasswordAction } from '~/features/bruker/profile/actions';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinInput } from '~/components/EinInput/EinInput';
import { useTranslation } from '~/hooks/useTranslation';
import styles from './ProfileForms.module.scss';

export default function ChangePasswordForm() {
  const t = useTranslation();
  const [state, formAction, isPending] = useActionState(
    updatePasswordAction,
    {},
  );

  const errorMessage =
    state.error === 'passwordMismatch'
      ? t('bruker.profilePage.passwordMismatch')
      : state.error === 'wrongPassword'
        ? t('bruker.profilePage.wrongPassword')
        : state.error
          ? (state.errorMessage ?? t('bruker.profilePage.changePasswordError'))
          : undefined;

  return (
    <section className={styles.section}>
      <h2 className="ds-heading" data-size="sm">
        {t('bruker.profilePage.changePassword')}
      </h2>
      <form action={formAction} className={styles.form}>
        <EinInput
          name="oldPassword"
          type="password"
          label={t('bruker.profilePage.currentPassword')}
          autoComplete="current-password"
          required
          fullWidth
        />
        <EinInput
          name="newPassword"
          type="password"
          label={t('bruker.profilePage.newPassword')}
          autoComplete="new-password"
          required
          fullWidth
        />
        <EinInput
          name="confirmPassword"
          type="password"
          label={t('bruker.profilePage.confirmNewPassword')}
          autoComplete="new-password"
          required
          fullWidth
        />
        {state.success && (
          <Alert data-color="success">
            {t('bruker.profilePage.changePasswordSuccess')}
          </Alert>
        )}
        {errorMessage && <Alert data-color="danger">{errorMessage}</Alert>}
        <EinButton type="submit" disabled={isPending}>
          {t('bruker.profilePage.saveChanges')}
        </EinButton>
      </form>
    </section>
  );
}
