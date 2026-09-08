'use client';

import { Alert } from '@digdir/designsystemet-react';
import { useActionState, useEffect, useRef } from 'react';
import { updateEmailAction } from '~/features/bruker/profile/actions';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinInput } from '~/components/EinInput/EinInput';
import { useTranslation } from '~/hooks/useTranslation';
import styles from './ProfileForms.module.scss';

type Props = {
  currentEmail: string;
};

export default function ChangeEmailForm({ currentEmail }: Props) {
  const t = useTranslation();
  const [state, formAction, isPending] = useActionState(updateEmailAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  const errorMessage = state.error
    ? t(`bruker.profilePage.errors.${state.error}`) ||
      t('bruker.profilePage.changeEmailError')
    : undefined;

  useEffect(() => {
    if (state.error) {
      formRef.current
        ?.querySelector<HTMLInputElement>('input[name="email"]')
        ?.focus();
    }
  }, [state]);

  return (
    <section className={styles.section}>
      <h2 className="ds-heading" data-size="sm">
        {t('bruker.profilePage.changeEmail')}
      </h2>
      <form
        noValidate
        ref={formRef}
        action={formAction}
        className={styles.form}
      >
        <EinInput
          name="email"
          type="email"
          label={t('bruker.profilePage.newEmail')}
          placeholder={currentEmail}
          autoComplete="email"
          data-color="neutral"
          required
          fullWidth
        />
        {state.success && (
          <Alert data-color="success">
            {t('bruker.profilePage.changeEmailSuccess')}
          </Alert>
        )}
        {errorMessage && <Alert data-color="danger">{errorMessage}</Alert>}
        <EinButton type="submit" variant="primary" disabled={isPending}>
          {t('bruker.profilePage.saveEmailChanges')}
        </EinButton>
      </form>
    </section>
  );
}
