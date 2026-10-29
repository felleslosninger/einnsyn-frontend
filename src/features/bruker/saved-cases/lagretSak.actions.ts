'use server';

import { cachedApiClient } from '~/lib/api/api.server';
import { cachedAuthInfo } from '~/lib/auth/auth.server';
import { logger } from '~/lib/utils/logger';

export async function setLagretSakSubscription(
  id: string,
  subscribe: boolean,
): Promise<boolean> {
  const authInfo = await cachedAuthInfo();
  if (!authInfo?.id) {
    return false;
  }

  try {
    const api = await cachedApiClient();
    await api.lagretsak.update(id, { subscribe });
  } catch (error) {
    logger.error('Failed to update saved case subscription', error);
    return false;
  }

  return true;
}

export async function deleteLagretSak(id: string): Promise<boolean> {
  const authInfo = await cachedAuthInfo();
  if (!authInfo?.id) {
    return false;
  }

  try {
    const api = await cachedApiClient();
    await api.lagretsak.delete(id);
  } catch (error) {
    logger.error('Failed to delete saved case', error);
    return false;
  }

  return true;
}
