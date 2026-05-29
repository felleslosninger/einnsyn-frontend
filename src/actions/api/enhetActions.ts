'use server';

import { EInnsynError, type Enhet } from '@digdir/einnsyn-sdk';
import { cache } from 'react';
import { logger } from '~/lib/utils/logger';
import { cachedApiClient } from './getApiClient';

export type TrimmedEnhet = Pick<
  Enhet,
  | 'entity'
  | 'id'
  | 'orgnummer'
  | 'navn'
  | 'navnNynorsk'
  | 'navnEngelsk'
  | 'navnSami'
  | 'enhetstype'
  | 'parent'
>;

// Module-level cache — survives across requests in the same server process.
// The enhet list is global/public data that changes at most a few times a day,
// so a 1-hour TTL eliminates the repeated 4-5s API round-trips without
// meaningfully staling the data.
let _enhetListCache: TrimmedEnhet[] | null = null;
let _enhetListExpiry = 0;
const ENHET_CACHE_TTL_MS = 60 * 60 * 1000;

export const getTrimmedEnhetList = async () => {
  if (_enhetListCache && Date.now() < _enhetListExpiry) {
    return _enhetListCache;
  }

  const api = await cachedApiClient();
  try {
    logger.debug('Fetching enhet list from API');
    const enhetList = await api.enhet.list({
      limit: 100,
    });
    const trimmedEnhetList: TrimmedEnhet[] = [];
    for await (const enhet of api.iterate(enhetList)) {
      trimmedEnhetList.push({
        entity: enhet.entity,
        id: enhet.id,
        navn: enhet.navn,
        navnNynorsk: enhet.navnNynorsk,
        navnEngelsk: enhet.navnEngelsk,
        navnSami: enhet.navnSami,
        orgnummer: enhet.orgnummer,
        enhetstype: enhet.enhetstype,
        parent:
          typeof enhet.parent === 'string' ? enhet.parent : enhet.parent?.id,
      });
    }

    _enhetListCache = trimmedEnhetList;
    _enhetListExpiry = Date.now() + ENHET_CACHE_TTL_MS;
    return trimmedEnhetList;
  } catch (error) {
    if (error instanceof EInnsynError) {
      logger.error('Error fetching enhet list', error);
    }
    return [] as TrimmedEnhet[];
  }
};

// React cache() handles per-request deduplication on top of the module-level cache.
export const cachedTrimmedEnhetList = cache(getTrimmedEnhetList);
