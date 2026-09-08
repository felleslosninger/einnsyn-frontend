'use client';

import { Alert, Heading } from '@digdir/designsystemet-react';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useRef } from 'react';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinInput } from '~/components/EinInput/EinInput';
import { updateEmailAction } from '~/features/bruker/profile/brukerActions';
import { useTranslation } from '~/hooks/useTranslation';
import styles from './ProfileForms.module.scss';

type Props = {
  currentEmail: string;
};

export default function ChangeEmailForm({ currentEmail }: Props) {
  const t = useTranslation();
  const [state, formAction, isPending] = useActionState(updateEmailAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const errorMessage = (() => {
    if (!state.error) return undefined;
    const key = `bruker.profilePage.errors.${state.error}`;
    const msg = t(key);
    return msg !== key ? msg : t('bruker.profilePage.changeEmailError');
  })();

  useEffect(() => {
    if (state.success) {
      router.refresh();
    } else if (state.error) {
      formRef.current
        ?.querySelector<HTMLInputElement>('input[name="email"]')
        ?.focus();
    }
  }, [state, router.refresh]);

  return (
    <section className={styles.section}>
      <Heading level={2} className="ds-heading" data-size="sm">
        {t('bruker.profilePage.changeEmail')}
      </Heading>
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
