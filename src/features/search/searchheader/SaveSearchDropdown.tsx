'use client';

import { Alert, Checkbox } from '@digdir/designsystemet-react';
import { BookmarkIcon } from '@navikt/aksel-icons';
import { useActionState, useEffect, useRef } from 'react';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinDropdown } from '~/components/EinDropdown';
import { EinInput } from '~/components/EinInput/EinInput';
import { EinLink } from '~/components/EinLink/EinLink';
import {
  useOptimisticPathname,
  useOptimisticSearchParams,
} from '~/components/NavigationProvider/NavigationProvider';
import { useSessionData } from '~/components/SessionDataProvider/SessionDataProvider';
import { addLagretSoekAction } from '~/features/bruker/saved-searches/lagretSoek.actions';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import styles from './SaveSearchDropdown.module.scss';

/**
 * Saves the current search, as a dropdown next to the search filter.
 */
export default function SaveSearchDropdown({
  className,
}: {
  className?: string;
}) {
  const t = useTranslation();
  const { authInfo } = useSessionData();
  const isBruker = authInfo?.type === 'Bruker';

  return (
    <EinDropdown
      trigger={
        <span className={styles.saveSearchTrigger}>
          <BookmarkIcon
            aria-hidden="true"
            focusable="false"
            className={styles.saveSearchIcon}
          />
          {t('search.saveSearch')}
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
      className={cn(styles.saveSearchDropdown, className)}
    >
      {!isBruker ? (
        <div className={styles.saveSearchLoginPrompt}>
          <span>{t('search.saveSearchLoginPrompt')}</span>
          <EinButton asChild fullWidth data-color="accent">
            <EinLink unstyled href="/login">
              {t('site.login')}
            </EinLink>
          </EinButton>
        </div>
      ) : (
        <SaveSearchForm />
      )}
    </EinDropdown>
  );
}

/**
 * Mounted only while the dropdown is open, so each reopen starts with an empty
 * form and no result from the last save.
 */
function SaveSearchForm() {
  const t = useTranslation();
  const searchParams = useOptimisticSearchParams();
  const pathname = useOptimisticPathname();
  const [state, formAction, isPending] = useActionState(
    addLagretSoekAction,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.error === 'missingLabel') {
      formRef.current
        ?.querySelector<HTMLInputElement>('input[name="label"]')
        ?.focus();
    }
  }, [state]);

  const labelError =
    state.error === 'missingLabel'
      ? t('search.saveSearchMissingLabel')
      : undefined;

  return (
    <form
      noValidate
      ref={formRef}
      action={formAction}
      className={styles.saveSearchForm}
    >
      <input type="hidden" name="pathname" value={pathname} />
      <input
        type="hidden"
        name="searchParams"
        value={searchParams?.toString() ?? ''}
      />
      <EinInput
        name="label"
        label={t('search.saveSearchName')}
        maxLength={255}
        autoComplete="off"
        required
        defaultValue={state.label}
        errorMessage={labelError}
        aria-invalid={labelError ? true : undefined}
        fullWidth
      />
      <Checkbox
        name="subscribe"
        label={t('search.saveSearchSubscribe')}
        defaultChecked={state.subscribe}
        data-color="accent"
      />
      <EinButton
        type="submit"
        disabled={isPending}
        fullWidth
        data-color="accent"
      >
        {isPending ? t('common.creating') : t('search.saveSearch')}
      </EinButton>
      {state.error === 'saveFailed' && (
        <Alert data-color="danger" role="alert">
          {t('search.saveSearchError')}
        </Alert>
      )}
      {state.success && (
        <Alert data-color="success" role="status">
          {t('search.saveSearchSuccess')}
        </Alert>
      )}
    </form>
  );
}
