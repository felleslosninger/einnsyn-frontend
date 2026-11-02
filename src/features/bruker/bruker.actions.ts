'use server';

import { cachedApiClient } from '~/lib/api/api.server';
import { logger } from '~/lib/utils/logger';

export async function setLagretSakSubscriptionAction(
  id: string,
  subscribe: boolean,
): Promise<boolean> {
  try {
    const api = await cachedApiClient();
    await api.lagretsak.update(id, { subscribe });
    return true;
  } catch (error) {
    logger.error('Failed to update saved case subscription', error);
    return false;
  }
}

export async function deleteBrukerItemAction(
  entity: 'LagretSak' | 'Innsynskrav',
  id: string,
): Promise<boolean> {
  try {
    const api = await cachedApiClient();
    await (entity === 'LagretSak' ? api.lagretsak : api.innsynskrav).delete(id);
    return true;
  } catch (error) {
    logger.error(`Failed to delete ${entity}`, error);
    return false;
  }
}
