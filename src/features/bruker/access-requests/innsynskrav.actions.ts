'use server';

import { cachedApiClient } from '~/lib/api/api.server';
import { cachedAuthInfo } from '~/lib/auth/auth.server';
import { logger } from '~/lib/utils/logger';

export async function deleteInnsynskrav(id: string): Promise<boolean> {
  const authInfo = await cachedAuthInfo();
  if (!authInfo?.id) {
    return false;
  }

  try {
    const api = await cachedApiClient();
    await api.innsynskrav.delete(id);
  } catch (error) {
    logger.error('Failed to delete access request', error);
    return false;
  }

  return true;
}
