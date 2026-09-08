'use client';

import { Alert } from '@digdir/designsystemet-react';
import { useActionState, useEffect, useRef } from 'react';
import { updatePasswordAction } from '~/features/bruker/profile/actions';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinInput } from '~/components/EinInput/EinInput';
import { useTranslation } from '~/hooks/useTranslation';
import styles from './ProfileForms.module.scss';

const ERROR_FIELD_MAP: Record<string, string> = {
  wrongPassword: 'oldPassword',
  missingFields: 'oldPassword',
  invalidPassword: 'newPassword',
  passwordMismatch: 'confirmPassword',
};

export default function ChangePasswordForm() {
  const t = useTranslation();
  const [state, formAction, isPending] = useActionState(
    updatePasswordAction,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  const errorMessage = state.error
    ? t(`bruker.profilePage.errors.${state.error}`) ||
      t('bruker.profilePage.changePasswordError')
    : undefined;

  useEffect(() => {
    if (state.error) {
      const fieldName = ERROR_FIELD_MAP[state.error] ?? 'oldPassword';
      formRef.current
        ?.querySelector<HTMLInputElement>(`input[name="${fieldName}"]`)
        ?.focus();
    }
  }, [state]);

  return (
    <section className={styles.section}>
      <h2 className="ds-heading" data-size="sm">
        {t('bruker.profilePage.changePassword')}
      </h2>
      <form noValidate ref={formRef} action={formAction} className={styles.form}>
        <EinInput
          name="oldPassword"
          type="password"
          label={t('bruker.profilePage.currentPassword')}
          autoComplete="current-password"
          data-color="neutral"
          required
          fullWidth
        />
        <EinInput
          name="newPassword"
          type="password"
          label={t('bruker.profilePage.newPassword')}
          autoComplete="new-password"
          data-color="neutral"
          required
          fullWidth
        />
        <EinInput
          name="confirmPassword"
          type="password"
          label={t('bruker.profilePage.confirmNewPassword')}
          autoComplete="new-password"
          data-color="neutral"
          required
          fullWidth
        />
        {state.success && (
          <Alert data-color="success">
            {t('bruker.profilePage.changePasswordSuccess')}
          </Alert>
        )}
        {errorMessage && <Alert data-color="danger">{errorMessage}</Alert>}
        <EinButton
          variant="primary"
          type="submit"
          data-color="default"
          disabled={isPending}
        >
          {t('bruker.profilePage.savePasswordChanges')}
        </EinButton>
      </form>
    </section>
  );
}
