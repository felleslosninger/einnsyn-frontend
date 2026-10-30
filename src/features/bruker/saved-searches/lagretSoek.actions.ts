'use server';

import { getSearchParameters } from '~/features/search/search.server';
import { cachedApiClient } from '~/lib/api/api.server';
import { cachedAuthInfo } from '~/lib/auth/auth.server';
import { getPathEnhet } from '~/lib/routing/pathname';
import { logger } from '~/lib/utils/logger';

export type AddLagretSoekState = {
  success?: boolean;
  error?: 'missingLabel' | 'saveFailed';
  // Echoed back so a failed save doesn't clear what the user entered.
  label?: string;
  subscribe?: boolean;
};

/**
 * `useActionState` on the save search form. The search is sent as the URL
 * describes it, and turned into the same parameters the search itself runs
 * with.
 */
export async function addLagretSoekAction(
  _previousState: AddLagretSoekState,
  formData: FormData,
): Promise<AddLagretSoekState> {
  const label = (formData.get('label') as string)?.trim();
  const subscribe = formData.get('subscribe') !== null;
  if (!label) {
    return { error: 'missingLabel', subscribe };
  }

  const authInfo = await cachedAuthInfo();
  if (authInfo?.type !== 'Bruker' || !authInfo.id) {
    return { error: 'saveFailed', label, subscribe };
  }

  const pathname = (formData.get('pathname') as string) ?? '';
  const searchParams = new URLSearchParams(
    (formData.get('searchParams') as string) ?? '',
  );

  try {
    const api = await cachedApiClient();
    await api.bruker.addLagretSoek(authInfo.id, {
      label,
      searchParameters: getSearchParameters(
        getPathEnhet(pathname),
        searchParams,
      ),
      subscribe,
    });
  } catch (error) {
    logger.error('Failed to save search', error);
    return { error: 'saveFailed', label, subscribe };
  }

  return { success: true };
}
