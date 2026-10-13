'use client';

import { Alert, Heading, Paragraph } from '@digdir/designsystemet-react';
import { PencilIcon } from '@navikt/aksel-icons';
import { useActionState, useEffect, useRef, useState } from 'react';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinInput } from '~/components/EinInput/EinInput';
import { updatePasswordAction } from '~/features/bruker/profile/bruker.actions';
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
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const hasEditedRef = useRef(false);
  const [isEditing, setIsEditing] = useState(false);
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
      setIsEditing(false);
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

  useEffect(() => {
    if (isEditing) {
      hasEditedRef.current = true;
      formRef.current
        ?.querySelector<HTMLInputElement>('input[name="oldPassword"]')
        ?.focus();
    } else if (hasEditedRef.current) {
      editButtonRef.current?.focus();
    }
  }, [isEditing]);

  return (
    <div className={styles.profileSection}>
      <Heading level={3} className="ds-heading" data-size="xs">
        {t('site.password')}
      </Heading>
      {!isEditing ? (
        <div className={styles.viewRow}>
          <Paragraph>••••••••••</Paragraph>
          <EinButton
            ref={editButtonRef}
            type="button"
            style="link"
            data-size="sm"
            onClick={() => setIsEditing(true)}
          >
            <PencilIcon aria-hidden="true" focusable="false" />
            {t('common.change')}
          </EinButton>
        </div>
      ) : (
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
          {errorMessage && <Alert data-color="danger">{errorMessage}</Alert>}
          <div className={styles.formActions}>
            <EinButton
              variant="primary"
              type="submit"
              disabled={isPending}
            >
              {t('bruker.profilePage.savePasswordChanges')}
            </EinButton>
            <EinButton
              type="button"
              variant="secondary"
              onClick={() => setIsEditing(false)}
            >
              {t('common.cancel')}
            </EinButton>
          </div>
        </form>
      )}
    </div>
  );
}
