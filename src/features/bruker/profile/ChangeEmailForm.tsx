'use client';

import { Alert } from '@digdir/designsystemet-react';
import { useActionState } from 'react';
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

  return (
    <section className={styles.section}>
      <h2 className="ds-heading" data-size="sm">
        {t('bruker.profilePage.changeEmail')}
      </h2>
      <form action={formAction} className={styles.form}>
        <EinInput
          name="email"
          type="email"
          label={t('bruker.profilePage.newEmail')}
          placeholder={currentEmail}
          autoComplete="email"
          required
          fullWidth
        />
        {state.success && (
          <Alert data-color="success">
            {t('bruker.profilePage.changeEmailSuccess')}
          </Alert>
        )}
        {state.error && (
          <Alert data-color="danger">
            {state.error === 'emailTaken'
              ? t('bruker.profilePage.emailTaken')
              : (state.errorMessage ?? t('bruker.profilePage.changeEmailError'))}
          </Alert>
        )}
        <EinButton type="submit" disabled={isPending}>
          {t('bruker.profilePage.saveChanges')}
        </EinButton>
      </form>
    </section>
  );
}
