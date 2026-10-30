'use server';

import { cachedApiClient } from '~/lib/api/api.server';
import { logger } from '~/lib/utils/logger';

export async function setLagretSakSubscription(id: string, subscribe: boolean) {
  try {
    const api = await cachedApiClient();
    await api.lagretsak.update(id, { subscribe });
    return true;
  } catch (error) {
    logger.error('Failed to update subscription', error);
    return false;
  }
}

export async function deleteBrukerItem(
  entity: 'LagretSak' | 'Innsynskrav',
  id: string,
) {
  try {
    const api = await cachedApiClient();
    await (entity === 'LagretSak' ? api.lagretsak : api.innsynskrav).delete(id);
    return true;
  } catch (error) {
    logger.error(`Failed to delete ${entity}`, error);
    return false;
  }
}
