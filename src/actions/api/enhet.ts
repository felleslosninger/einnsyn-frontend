'use server';

import {
    type Base,
    EInnsynError,
    type FilterParameters,
    type PaginatedList,
    type SearchParameters,
    type Enhet,
} from '@digdir/einnsyn-sdk';
import { logger } from '~/lib/utils/logger';
import { cachedApiClient } from './getApiClient';


export async function getEnhetInfo(
    enhetSlug: string,
    searchParams: URLSearchParams,
) {
    const api = await cachedApiClient();

    // Collect enhet IDs from path and searchParams
    const enhet: string[] = [];
    if (enhetSlug) {
        enhet.push(enhetSlug);
    }
    if (searchParams.has('enhet')) {
        enhet.push(...(searchParams.getAll('enhet') ?? []));
    }

    // Remove duplicates and empty values
    const uniqueEnheter = Array.from(new Set(enhet.filter(Boolean)));

    if (!uniqueEnheter.length) {
        return [];
    }

    try {
        // Build the query object for the enhet list endpoint
        const apiQuery = { ids: uniqueEnheter };
        const result = await api.enhet.list(apiQuery);
        return result.items ?? [];
    } catch (error) {
        if (error instanceof EInnsynError) {
            logger.error('Error fetching enhetsobjekt info', error);
        }
        return [];
    }
};