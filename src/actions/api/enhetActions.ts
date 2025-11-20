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

export const getTrimmedEnhetList = async () => {
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

    return trimmedEnhetList;
  } catch (error) {
    if (error instanceof EInnsynError) {
      logger.error('Error fetching enhet list', error);
    }
    return [] as TrimmedEnhet[];
  }
};

export const cachedTrimmedEnhetList = cache(getTrimmedEnhetList);
