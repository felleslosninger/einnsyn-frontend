'use server';

import { EInnsynError, type Enhet } from '@digdir/einnsyn-sdk';
import { logger } from '~/lib/utils/logger';
import { cachedApiClient } from './getApiClient';

export async function getEnhetInfo(enhetIds: string[]): Promise<Enhet[]> {
  if (!enhetIds.length) return [];

  const api = await cachedApiClient();
  try {
    const result = await api.enhet.list({ ids: enhetIds });
    return result.items ?? [];
  } catch (error) {
    if (error instanceof EInnsynError) {
      logger.error('Error fetching enhet info', error);
    }
    return [];
  }
}
