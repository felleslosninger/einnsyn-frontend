'use client';

import { Alert, Checkbox } from '@digdir/designsystemet-react';
import { BellIcon } from '@navikt/aksel-icons';
import { useActionState } from 'react';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinDropdown } from '~/components/EinDropdown';
import { EinLink } from '~/components/EinLink/EinLink';
import { useSessionData } from '~/components/SessionDataProvider/SessionDataProvider';
import {
  type AddLagretSakState,
  addLagretSakAction,
  type LagretSakTarget,
} from '~/features/bruker/saved-cases/lagretSak.actions';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import { toLocalizedPath } from '~/lib/routing/pathname';
import styles from './SaveCaseDropdown.module.scss';

/**
 * Saves a saksmappe or moetemappe, as a dropdown in the header row. Reads its
 * texts from `${translationKey}.follow`, `.followSubscribe`, `.followSaved`,
 * `.followError` and `.followLoginPrompt`.
 *
 * Nothing tells the page whether the user has already saved the case, so
 * `isSaved` starts out false, and a save is only remembered while this
 * component stays mounted.
 * Once the case carries that itself, pass it as `isSaved`.
 */
export default function SaveCaseDropdown({
  target,
  translationKey,
  isSaved = false,
}: {
  target: LagretSakTarget;
  translationKey: string;
  isSaved?: boolean;
}) {
  const t = useTranslation();
  const languageCode = useLanguageCode();
  const { authInfo } = useSessionData();
  const isBruker = authInfo?.type === 'Bruker';
  // Kept here, as the form is unmounted each time the dropdown closes. A
  // pending or finished save, and what was chosen, must outlive it.
  const [state, formAction, isPending] = useActionState(
    async (
      previousState: AddLagretSakState,
      formData: FormData,
    ): Promise<AddLagretSakState> => {
      try {
        return await addLagretSakAction(target, previousState, formData);
      } catch {
        // The request itself failed, so the action never got to answer.
        return {
          error: 'saveFailed',
          subscribe: formData.get('subscribe') !== null,
        };
      }
    },
    { subscribe: true },
  );

  return (
    <EinDropdown
      trigger={
        <span className={styles.saveCaseTrigger}>
          <BellIcon aria-hidden="true" focusable="false" />
          {t(`${translationKey}.follow`)}
        </span>
      }
      closeOnItemClick={!isBruker}
      preferredPosition={[
        'belowRight',
        'belowLeft',
        'rightTop',
        'leftTop',
        'right',
        'left',
        'below',
        'above',
      ]}
      className={styles.saveCaseDropdown}
      triggerClassName={styles.saveCaseTriggerButton}
    >
      {!isBruker ? (
        <div className={styles.saveCaseContent}>
          <span>{t(`${translationKey}.followLoginPrompt`)}</span>
          <EinButton asChild fullWidth data-color="accent">
            <EinLink unstyled href={toLocalizedPath(languageCode, '/login')}>
              {t('site.login')}
            </EinLink>
          </EinButton>
        </div>
      ) : (
        <SaveCaseForm
          translationKey={translationKey}
          state={state}
          formAction={formAction}
          isPending={isPending}
          saved={isSaved || !!state.success}
        />
      )}
    </EinDropdown>
  );
}

/** Mounted only while the dropdown is open. */
function SaveCaseForm({
  translationKey,
  state,
  formAction,
  isPending,
  saved,
}: {
  translationKey: string;
  state: AddLagretSakState;
  formAction: (formData: FormData) => void;
  isPending: boolean;
  saved: boolean;
}) {
  const t = useTranslation();
  const isBlocked = isPending || saved;

  return (
    <form action={formAction} className={styles.saveCaseContent}>
      <Checkbox
        name="subscribe"
        label={t(`${translationKey}.followSubscribe`)}
        defaultChecked={state.subscribe}
        disabled={saved}
        data-color="accent"
      />
      <EinButton
        type="submit"
        // Not `disabled`, which would drop keyboard focus from the button.
        aria-disabled={isBlocked}
        onClick={(e) => {
          if (isBlocked) {
            e.preventDefault();
          }
        }}
        fullWidth
        data-color="accent"
      >
        {isPending ? t('common.saving') : t(`${translationKey}.follow`)}
      </EinButton>
      {state.error === 'saveFailed' && (
        <Alert data-color="danger" role="alert">
          {t(`${translationKey}.followError`)}
        </Alert>
      )}
      {saved && (
        <Alert data-color="success" role="status">
          {t(`${translationKey}.followSaved`)}
        </Alert>
      )}
    </form>
  );
}
