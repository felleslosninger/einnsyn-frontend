'use server';

import { cachedApiClient } from '~/lib/api/api.server';
import { logger } from '~/lib/utils/logger';

export async function setBrukerItemSubscriptionAction(
  entity: 'LagretSak' | 'LagretSoek',
  id: string,
  subscribe: boolean,
): Promise<boolean> {
  try {
    const api = await cachedApiClient();
    await (entity === 'LagretSak' ? api.lagretsak : api.lagretsoek).update(id, {
      subscribe,
    });
    return true;
  } catch (error) {
    logger.error(`Failed to update ${entity} subscription`, error);
    return false;
  }
}

export async function deleteBrukerItemAction(
  entity: 'LagretSak' | 'LagretSoek' | 'Innsynskrav',
  id: string,
): Promise<boolean> {
  try {
    const api = await cachedApiClient();
    const resources = {
      LagretSak: api.lagretsak,
      LagretSoek: api.lagretsoek,
      Innsynskrav: api.innsynskrav,
    };
    await resources[entity].delete(id);
    return true;
  } catch (error) {
    logger.error(`Failed to delete ${entity}`, error);
    return false;
  }
}
