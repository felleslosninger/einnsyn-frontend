'use server';

import { cachedApiClient } from '~/lib/api/api.server';
import { cachedAuthInfo } from '~/lib/auth/auth.server';
import { logger } from '~/lib/utils/logger';

export async function setLagretSoekSubscription(
  id: string,
  subscribe: boolean,
): Promise<boolean> {
  const authInfo = await cachedAuthInfo();
  if (!authInfo?.id) {
    return false;
  }

  try {
    const api = await cachedApiClient();
    await api.lagretsoek.update(id, { subscribe });
  } catch (error) {
    logger.error('Failed to update saved search subscription', error);
    return false;
  }

  return true;
}

export async function deleteLagretSoek(id: string): Promise<boolean> {
  const authInfo = await cachedAuthInfo();
  if (!authInfo?.id) {
    return false;
  }

  try {
    const api = await cachedApiClient();
    await api.lagretsoek.delete(id);
  } catch (error) {
    logger.error('Failed to delete saved search', error);
    return false;
  }

  return true;
}
