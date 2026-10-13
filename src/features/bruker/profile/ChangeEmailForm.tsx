'use client';

import { Alert, Heading, Paragraph } from '@digdir/designsystemet-react';
import { PencilIcon } from '@navikt/aksel-icons';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useRef, useState } from 'react';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinInput } from '~/components/EinInput/EinInput';
import { updateEmailAction } from '~/features/bruker/profile/bruker.actions';
import { useTranslation } from '~/hooks/useTranslation';
import styles from './ProfileForms.module.scss';

type Props = {
  currentEmail: string;
};

export default function ChangeEmailForm({ currentEmail }: Props) {
  const t = useTranslation();
  const [state, formAction, isPending] = useActionState(updateEmailAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const hasEditedRef = useRef(false);
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [emailValue, setEmailValue] = useState('');

  const errorMessage = (() => {
    if (!state.error) return undefined;
    const key = `bruker.profilePage.errors.${state.error}`;
    const msg = t(key);
    return msg !== key ? msg : t('bruker.profilePage.changeEmailError');
  })();

  useEffect(() => {
    if (state.success) {
      setIsEditing(false);
      setEmailValue('');
      router.refresh();
    } else if (state.error) {
      formRef.current
        ?.querySelector<HTMLInputElement>('input[name="email"]')
        ?.focus();
    }
  }, [state, router]);

  useEffect(() => {
    if (isEditing) {
      hasEditedRef.current = true;
      formRef.current
        ?.querySelector<HTMLInputElement>('input[name="email"]')
        ?.focus();
    } else if (hasEditedRef.current) {
      editButtonRef.current?.focus();
    }
  }, [isEditing]);

  return (
    <div className={styles.profileSection}>
      <Heading level={3} className="ds-heading" data-size="xs">
        {t('common.email')}
      </Heading>
      {!isEditing ? (
        <div className={styles.viewRow}>
          <Paragraph>{currentEmail}</Paragraph>
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
            name="email"
            type="email"
            label={t('bruker.profilePage.newEmail')}
            placeholder={currentEmail}
            autoComplete="email"
            data-color="neutral"
            required
            fullWidth
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
          />
          {errorMessage && <Alert data-color="danger">{errorMessage}</Alert>}
          <div className={styles.formActions}>
            <EinButton type="submit" variant="primary" disabled={isPending}>
              {t('bruker.profilePage.saveEmailChanges')}
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
