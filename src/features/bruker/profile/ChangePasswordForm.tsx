'use client';

import { Alert, Card, Heading, Paragraph } from '@digdir/designsystemet-react';
import { PadlockLockedIcon, PencilIcon } from '@navikt/aksel-icons';
import { useActionState, useEffect, useRef, useState } from 'react';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinInput } from '~/components/EinInput/EinInput';
import { useTranslation } from '~/hooks/useTranslation';
import styles from './ProfileForms.module.scss';
import { updatePasswordAction } from './profile.actions';

const ERROR_FIELD_MAP: Record<string, string> = {
  wrongPassword: 'oldPassword',
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

  const errorMessage =
    state.error && t(`bruker.profilePage.errors.${state.error}`);

  const startEditing = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsEditing(true);
  };

  useEffect(() => {
    if (state.success) {
      setIsEditing(false);
    } else if (state.error) {
      let fieldName: string;
      if (state.error === 'missingFields') {
        const oldInput = formRef.current?.querySelector<HTMLInputElement>(
          'input[name="oldPassword"]',
        );
        fieldName = !oldInput?.value ? 'oldPassword' : 'newPassword';
      } else {
        fieldName = ERROR_FIELD_MAP[state.error] ?? 'oldPassword';
      }
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
    <Card.Block className={styles.profileSection}>
      <Heading level={4} className="ds-heading" data-size="2xs">
        <span className={styles.headingWithIcon}>
          <PadlockLockedIcon aria-hidden="true" focusable="false" />
          {t('site.password')}
        </span>
      </Heading>
      {!isEditing ? (
        <>
          <div className={styles.viewRow}>
            <Paragraph>•••••••••••••</Paragraph>
            <EinButton
              ref={editButtonRef}
              type="button"
              variant="tertiary"
              data-size="sm"
              aria-label={`${t('common.change')} ${t('site.password')}`}
              onClick={startEditing}
            >
              <PencilIcon aria-hidden="true" focusable="false" />
              {t('common.change')}
            </EinButton>
          </div>
          {state.success && (
            <Alert data-color="success" role="status">
              {t('bruker.profilePage.changePasswordSuccess')}
            </Alert>
          )}
        </>
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
            <EinButton type="submit" disabled={isPending}>
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
    </Card.Block>
  );
}
