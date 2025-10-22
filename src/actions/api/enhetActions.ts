'use server';

import { EInnsynError } from '@digdir/einnsyn-sdk';
import { cache } from 'react';
import { logger } from '~/lib/utils/logger';
import { cachedApiClient } from './getApiClient';

export type TrimmedEnhet = {
  id: string;
  slug: string;
  name: {
    nb: string;
    nn?: string;
    en?: string;
    se?: string;
  };
  parentId: string | null;
  type:
    | 'ADMINISTRATIVENHET'
    | 'AVDELING'
    | 'BYDEL'
    | 'DUMMYENHET'
    | 'FYLKE'
    | 'KOMMUNE'
    | 'ORGAN'
    | 'SEKSJON'
    | 'UTVALG'
    | 'VIRKSOMHET';
};

export const getEnhetList = async () => {
  const api = await cachedApiClient();
  try {
    logger.debug('Fetching enhet list from API');
    const enhetList = await api.enhet.list({
      limit: 100,
    });
    const trimmedEnhetList: TrimmedEnhet[] = [];
    for await (const enhet of api.iterate(enhetList)) {
      trimmedEnhetList.push({
        id: enhet.id,
        slug: enhet.id,
        name: {
          nb: enhet.navn,
          nn: enhet.navnNynorsk,
          en: enhet.navnEngelsk,
          se: enhet.navnSami,
        },
        type: enhet.enhetstype,
        parentId:
          typeof enhet.parent === 'string'
            ? enhet.parent
            : (enhet.parent?.id ?? null),
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

export const cachedEnhetList = cache(getEnhetList);
