'use client';

import { Alert } from '@digdir/designsystemet-react';
import type { SearchParameters } from '@digdir/einnsyn-sdk';
import { BookmarkIcon } from '@navikt/aksel-icons';
import { useActionState, useEffect, useRef } from 'react';
import { Checkbox } from '@digdir/designsystemet-react';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinDropdown } from '~/components/EinDropdown';
import { EinInput } from '~/components/EinInput/EinInput';
import { EinLink } from '~/components/EinLink/EinLink';
import { useOptimisticSearchParams } from '~/components/NavigationProvider/NavigationProvider';
import { useSessionData } from '~/components/SessionDataProvider/SessionDataProvider';
import { addSavedSearch } from '~/features/bruker/saved-searches/lagretSoekActions';
import { useEnhetFilterIds } from '~/hooks/useEnhetFilterIds';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import styles from './SaveSearchDropdown.module.scss';

function buildSearchParameters(
  searchParams: URLSearchParams | undefined,
  pathEnhet: string | undefined,
): SearchParameters {
  const params: SearchParameters = {};
  if (searchParams?.has('q')) params.query = searchParams.get('q') ?? undefined;
  const entities = searchParams?.getAll('entity') ?? [];
  if (entities.length) params.entity = entities as SearchParameters['entity'];
  const enhets = [
    ...(pathEnhet ? [pathEnhet] : []),
    ...(searchParams?.getAll('enhet') ?? []),
  ];
  if (enhets.length) params.administrativEnhet = enhets;
  return params;
}

type SaveSearchState = {
  success?: boolean;
  error?: string;
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
  const { pathEnhetValue } = useEnhetFilterIds();

  const [state, formAction, isPending] = useActionState(
    async (
      _previousState: SaveSearchState,
      formData: FormData,
    ): Promise<SaveSearchState> => {
      const label = (formData.get('label') as string)?.trim();
      if (!label) {
        return { error: t('search.saveSearchMissingLabel') };
      }

      try {
        const searchParameters = buildSearchParameters(
          searchParams,
          pathEnhetValue,
        );
        await addSavedSearch(
          label,
          searchParameters,
          formData.get('subscribe') !== null,
        );
        return { success: true };
      } catch {
        return { error: t('search.saveSearchError') };
      }
    },
    {},
  );

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.error) {
      formRef.current
        ?.querySelector<HTMLInputElement>('input[name="label"]')
        ?.focus();
    }
  }, [state.error]);

  const isBruker = authInfo?.type === 'Bruker';

  const query = searchParams?.get('q')?.trim() ?? '';
  const entity = searchParams?.get('entity') ?? '';
  const entityLabelKeys: Record<string, string> = {
    Saksmappe: 'saksmappe.label',
    Journalpost: 'journalpost.label',
    Moetemappe: 'moetemappe.label',
    Moetesak: 'moetesak.label',
  };
  const entityLabel =
    entity && entityLabelKeys[entity] ? t(entityLabelKeys[entity]) : '';
  const suggestedName = [query, entityLabel].filter(Boolean).join(' – ');

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
          <EinButton asChild fullWidth data-color="default">
            <EinLink unstyled href="/login">
              {t('site.login')}
            </EinLink>
          </EinButton>
        </div>
      ) : (
        <form
          ref={formRef}
          action={formAction}
          className={styles.saveSearchForm}
        >
          <EinInput
            name="label"
            label={t('search.saveSearchName')}
            defaultValue={suggestedName}
            maxLength={500}
            autoComplete="off"
            fullWidth
          />

          <div className={styles.saveSearchCheckbox}>
            <Checkbox
              id="save-search-subscribe"
              name="subscribe"
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
          {state.error && (
            <Alert data-color="danger" className={styles.saveSearchError}>
              {state.error}
            </Alert>
          )}
          {state.success && (
            <Alert
              data-color="success"
              className={styles.saveSearchSuccess}
              role="status"
            >
              {t('search.saveSearchSuccess')}
            </Alert>
          )}
        </form>
      )}
    </EinDropdown>
  );
}
