'use client';

import { Alert, Card, Heading, Paragraph } from '@digdir/designsystemet-react';
import { EnvelopeClosedIcon, PencilIcon } from '@navikt/aksel-icons';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useRef, useState } from 'react';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinInput } from '~/components/EinInput/EinInput';
import { useTranslation } from '~/hooks/useTranslation';
import styles from './ProfileForms.module.scss';
import { updateEmailAction } from './profile.actions';

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
  const [showAlert, setShowAlert] = useState(false);

  const errorMessage =
    state.error && t(`bruker.profilePage.errors.${state.error}`);

  const startEditing = () => {
    setEmailValue('');
    setShowAlert(false);
    setIsEditing(true);
  };

  useEffect(() => {
    setShowAlert(true);
    if (state.success) {
      setIsEditing(false);
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
    <Card.Block className={styles.profileSection}>
      <Heading level={4} className="ds-heading" data-size="2xs">
        <span className={styles.headingWithIcon}>
          <EnvelopeClosedIcon
            fontSize="1.5rem"
            aria-hidden="true"
            focusable="false"
          />
          {t('common.email')}
        </span>
      </Heading>
      {!isEditing ? (
        <>
          <div className={styles.viewRow}>
            <Paragraph>{currentEmail}</Paragraph>
            <EinButton
              ref={editButtonRef}
              type="button"
              variant="tertiary"
              data-size="sm"
              aria-label={`${t('common.change')} ${t('common.email')}`}
              onClick={startEditing}
            >
              <PencilIcon aria-hidden="true" focusable="false" />
              {t('common.change')}
            </EinButton>
          </div>
          {showAlert && state.success && (
            <Alert data-color="success" role="status">
              {t('bruker.profilePage.changeEmailSuccess')}
            </Alert>
          )}
        </>
      ) : (
        <form
          noValidate
          ref={formRef}
          action={formAction}
          className={styles.form}
          onChange={() => setShowAlert(false)}
        >
          <EinInput
            name="email"
            type="email"
            label={t('bruker.profilePage.newEmail')}
            autoComplete="email"
            data-color="neutral"
            required
            fullWidth
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
          />
          {showAlert && errorMessage && (
            <Alert data-color="danger">{errorMessage}</Alert>
          )}
          <div className={styles.formActions}>
            <EinButton type="submit" disabled={isPending}>
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
    </Card.Block>
  );
}
