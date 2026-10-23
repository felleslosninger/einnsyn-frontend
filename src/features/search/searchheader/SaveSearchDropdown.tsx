'use client';

import { Alert, Checkbox } from '@digdir/designsystemet-react';
import type { SearchParameters } from '@digdir/einnsyn-sdk';
import { BookmarkIcon } from '@navikt/aksel-icons';
import { useActionState, useEffect, useRef, useState } from 'react';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinDropdown } from '~/components/EinDropdown';
import { EinInput } from '~/components/EinInput/EinInput';
import { EinLink } from '~/components/EinLink/EinLink';
import {
  useOptimisticPathname,
  useOptimisticSearchParams,
} from '~/components/NavigationProvider/NavigationProvider';
import { useSessionData } from '~/components/SessionDataProvider/SessionDataProvider';
import { addSavedSearch } from '~/features/bruker/saved-searches/lagretSoekActions';
import { useTranslation } from '~/hooks/useTranslation';
import { getPathEnhet } from '~/lib/routing/pathname';
import { getEnhetSelection } from '~/lib/routing/searchParams';
import cn from '~/lib/utils/className';
import styles from './SaveSearchDropdown.module.scss';

function buildSearchParameters(
  searchParams: URLSearchParams | undefined,
  pathname: string,
): SearchParameters {
  const params: SearchParameters = {};
  if (searchParams?.has('q')) params.query = searchParams.get('q') ?? undefined;
  const entities = searchParams?.getAll('entity') ?? [];
  if (entities.length) params.entity = entities as SearchParameters['entity'];
  const enhets = getEnhetSelection(
    getPathEnhet(pathname),
    searchParams ?? new URLSearchParams(),
  );
  if (enhets.length) params.administrativEnhet = enhets;
  return params;
}

type SaveSearchState = {
  success?: boolean;
  labelError?: string;
  error?: string;
  // Echoed back so a failed save doesn't clear what the user entered.
  label?: string;
  subscribe?: boolean;
};

/**
 * Saves the current search, as a dropdown next to the search filter.
 *
 * The search is sent as the URL describes it — the enhet from the path and the
 * query string — so the saved search stores the same parameters the search
 * itself runs with.
 */
export default function SaveSearchDropdown({
  className,
}: {
  className?: string;
}) {
  const t = useTranslation();
  const { authInfo } = useSessionData();
  const searchParams = useOptimisticSearchParams();
  const pathname = useOptimisticPathname();

  const [state, formAction, isPending] = useActionState(
    async (
      _previousState: SaveSearchState,
      formData: FormData,
    ): Promise<SaveSearchState> => {
      const label = (formData.get('label') as string)?.trim();
      const subscribe = formData.get('subscribe') !== null;
      if (!label) {
        return { labelError: t('search.saveSearchMissingLabel'), subscribe };
      }

      try {
        const searchParameters = buildSearchParameters(searchParams, pathname);
        await addSavedSearch(label, searchParameters, subscribe);
        return { success: true };
      } catch {
        return { error: t('search.saveSearchError'), label, subscribe };
      }
    },
    {},
  );

  const formRef = useRef<HTMLFormElement>(null);
  // Hides the last save's result when the dropdown is reopened.
  const [hideResult, setHideResult] = useState(false);

  useEffect(() => {
    if (state.labelError) {
      formRef.current
        ?.querySelector<HTMLInputElement>('input[name="label"]')
        ?.focus();
    }
  }, [state.labelError]);

  const labelError = hideResult ? undefined : state.labelError;
  const isBruker = authInfo?.type === 'Bruker';

  return (
    <EinDropdown
      onOpenChange={(open) => open && setHideResult(true)}
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
          <EinButton asChild fullWidth data-color="default">
            <EinLink unstyled href="/login">
              {t('site.login')}
            </EinLink>
          </EinButton>
        </div>
      ) : (
        <form
          noValidate
          ref={formRef}
          onSubmit={() => setHideResult(false)}
          action={formAction}
          className={styles.saveSearchForm}
        >
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
          <div className={styles.saveSearchCheckbox}>
            <Checkbox
              id="save-search-subscribe"
              name="subscribe"
              defaultChecked={state.subscribe}
              aria-labelledby="save-search-subscribe-label"
            />
            <label
              id="save-search-subscribe-label"
              htmlFor="save-search-subscribe"
              className={styles.saveSearchCheckboxLabel}
            >
              {t('search.saveSearchSubscribe')}
            </label>
          </div>
          <EinButton
            type="submit"
            disabled={isPending}
            fullWidth
            data-color="accent"
          >
            {isPending ? t('common.creating') : t('search.saveSearch')}
          </EinButton>
          {!hideResult && state.error && (
            <Alert data-color="danger" role="alert">
              {state.error}
            </Alert>
          )}
          {!hideResult && state.success && (
            <Alert data-color="success" role="status">
              {t('search.saveSearchSuccess')}
            </Alert>
          )}
        </form>
      )}
    </EinDropdown>
  );
}
