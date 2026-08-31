'use client';

import { Alert } from '@digdir/designsystemet-react';
import { useActionState, useState } from 'react';
import { deactivateAccountAction } from '~/features/bruker/profile/actions';
import { EinButton } from '~/components/EinButton/EinButton';
import { useTranslation } from '~/hooks/useTranslation';
import styles from './ProfileForms.module.scss';

export default function DeactivateAccountSection() {
  const t = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, isPending] = useActionState(
    deactivateAccountAction,
    {},
  );

  return (
    <section className={styles.section}>
      <h2 className="ds-heading" data-size="sm">
        {t('bruker.profilePage.deactivateAccount')}
      </h2>
      <p>{t('bruker.profilePage.deactivateAccountDescription')}</p>
      {state.error && (
        <Alert data-color="danger">
          {state.errorMessage ?? t('bruker.profilePage.deactivateAccountError')}
        </Alert>
      )}
      {confirming ? (
        <div className={styles.confirmRow}>
          <p>{t('bruker.profilePage.deactivateAccountConfirm')}</p>
          <form action={formAction} className={styles.confirmActions}>
            <EinButton
              type="button"
              style="secondary"
              onClick={() => setConfirming(false)}
              disabled={isPending}
            >
              {t('common.cancel')}
            </EinButton>
            <EinButton type="submit" style="destructive" disabled={isPending}>
              {t('bruker.profilePage.deactivateAccount')}
            </EinButton>
          </form>
        </div>
      ) : (
        <EinButton
          type="button"
          style="destructive"
          onClick={() => setConfirming(true)}
        >
          {t('bruker.profilePage.deactivateAccount')}
        </EinButton>
      )}
    </section>
  );
}
