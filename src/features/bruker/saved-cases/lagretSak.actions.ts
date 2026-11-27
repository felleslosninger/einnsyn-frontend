'use server';

import { cachedApiClient } from '~/lib/api/api.server';
import { cachedAuthInfo } from '~/lib/auth/auth.server';
import { logger } from '~/lib/utils/logger';

/** The saksmappe or moetemappe to save. */
export type LagretSakTarget = { saksmappe: string } | { moetemappe: string };

export type AddLagretSakState = {
  success?: boolean;
  error?: 'saveFailed';
  // Echoed back so a failed save doesn't clear what the user chose.
  subscribe?: boolean;
};

/**
 * `useActionState` on the save case form, with the target bound as the first
 * argument.
 */
export async function addLagretSakAction(
  target: LagretSakTarget,
  _previousState: AddLagretSakState,
  formData: FormData,
): Promise<AddLagretSakState> {
  const subscribe = formData.get('subscribe') !== null;

  const authInfo = await cachedAuthInfo();
  if (authInfo?.type !== 'Bruker' || !authInfo.id) {
    return { error: 'saveFailed', subscribe };
  }

  try {
    const api = await cachedApiClient();
    await api.bruker.addLagretSak(authInfo.id, { ...target, subscribe });
  } catch (error) {
    logger.error('Failed to save case', error);
    return { error: 'saveFailed', subscribe };
  }

  return { success: true, subscribe };
}
