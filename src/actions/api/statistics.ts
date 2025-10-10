'use server';

import { EInnsynError } from '@digdir/einnsyn-sdk';
import { logger } from '~/lib/utils/logger';
import { cachedApiClient } from './getApiClient';

export async function getEnhetStats(
    enhetId: string[],
) {
    const api = await cachedApiClient();
    const now = new Date();
    const lastYear = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    
    try {
        const apiQuery = {
            administrativEnhet: enhetId,
            aggregateFrom: lastYear.toISOString().split('T')[0],
            aggregateTo: now.toISOString().split('T')[0],
        };
        const result = await api.statistics.query(apiQuery);
        return result;
    } catch (error) {
        if (error instanceof EInnsynError) {
            logger.error('Failed to fetch statistics', { 
                errorMessage: error.message, 
                errorCode: error.constructor.name,
                enhetId,
                dateRange: {
                    from: lastYear.toISOString(),
                    to: now.toISOString(),
                }
            });
        } else {
            logger.error('Unexpected error fetching statistics', { 
                error: error instanceof Error ? error.message : String(error), 
                enhetId 
            });
        }
        return null;
    }
};