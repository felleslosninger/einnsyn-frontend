'use server';

import {
    EInnsynError,
    type Enhet,
} from '@digdir/einnsyn-sdk';
import { logger } from '~/lib/utils/logger';
import { cachedApiClient } from './getApiClient';



export async function getEnhetInfo(
    enhetIds: string[],
) {
    const api = await cachedApiClient();

    if (!enhetIds.length) {
        return [];
    }

    try {
        // Build the query object for the enhet list endpoint
        const apiQuery = { ids: enhetIds };
        const result = await api.enhet.list(apiQuery);
        return result.items ?? [];
    } catch (error) {
        if (error instanceof EInnsynError) {
            logger.error('Error fetching enhetsobjekt info', error);
        }
        return [];
    }
};