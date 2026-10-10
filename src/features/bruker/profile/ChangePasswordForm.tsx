'use client';

import { Alert, Heading } from '@digdir/designsystemet-react';
import { useActionState, useEffect, useRef, useState } from 'react';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinInput } from '~/components/EinInput/EinInput';
import { updatePasswordAction } from '~/features/bruker/profile/brukerActions';
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
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const errorMessage = (() => {
    if (!state.error) return undefined;
    const key = `bruker.profilePage.errors.${state.error}`;
    const msg = t(key);
    return msg !== key ? msg : t('bruker.profilePage.changePasswordError');
  })();

  useEffect(() => {
    if (state.success) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else if (state.error) {
      const fieldName = ERROR_FIELD_MAP[state.error] ?? 'oldPassword';
      formRef.current
        ?.querySelector<HTMLInputElement>(`input[name="${fieldName}"]`)
        ?.focus();
    }
  }, [state]);

  return (
    <section className={styles.section}>
      <Heading level={2} className="ds-heading" data-size="sm">
        {t('bruker.profilePage.changePassword')}
      </Heading>
      <form
        noValidate
        ref={formRef}
        action={formAction}
        className={styles.form}
      >
        <EinInput
          name="oldPassword"
          type="password"
          label={t('bruker.profilePage.currentPassword')}
          autoComplete="current-password"
          data-color="neutral"
          required
          fullWidth
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
        />
        <EinInput
          name="newPassword"
          type="password"
          label={t('bruker.profilePage.newPassword')}
          autoComplete="new-password"
          data-color="neutral"
          required
          fullWidth
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <EinInput
          name="confirmPassword"
          type="password"
          label={t('bruker.profilePage.confirmNewPassword')}
          autoComplete="new-password"
          data-color="neutral"
          required
          fullWidth
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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
