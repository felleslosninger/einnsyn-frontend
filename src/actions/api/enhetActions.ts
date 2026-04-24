'use server';

import { EInnsynError } from '@digdir/einnsyn-sdk';
import { unstable_cache } from 'next/cache';
import { parseEnhetParam } from '~/components/SearchField/enhetTokenInputUtils';
import type { LanguageCode } from '~/lib/translation/translation';
import { logger } from '~/lib/utils/logger';
import {
  mergeTrimmedEnhetsWithAncestors,
  sortTrimmedEnhetsForSelector,
  type TrimmedEnhet,
} from '~/lib/utils/trimmedEnhetUtils';
import { cachedPublicApiClient } from './getApiClient';

const ENHET_LIST_REVALIDATE_SECONDS = 60 * 60;
const ENHET_LIST_TAG = 'enhet-list';
const DEFAULT_PRELOAD_LIMIT = 10;

const fetchTrimmedEnhetList = async (): Promise<TrimmedEnhet[]> => {
  const api = await cachedPublicApiClient();
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
        slug: enhet.slug,
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
    throw error;
  }
};

const getCachedTrimmedEnhetList = unstable_cache(
  fetchTrimmedEnhetList,
  ['trimmed-enhet-list'],
  { revalidate: ENHET_LIST_REVALIDATE_SECONDS, tags: [ENHET_LIST_TAG] },
);

export const getTrimmedEnhetList = async (): Promise<TrimmedEnhet[]> => {
  return getCachedTrimmedEnhetList();
};

function findTrimmedEnhetsByIdsOrSlugs(
  list: readonly TrimmedEnhet[],
  idsOrSlugs: readonly string[],
): TrimmedEnhet[] {
  const wanted = new Set(
    idsOrSlugs.map((value) => value.trim()).filter((value) => value.length > 0),
  );
  if (wanted.size === 0) {
    return [];
  }

  return list.filter(
    (enhet) =>
      wanted.has(enhet.id) || (enhet.slug != null && wanted.has(enhet.slug)),
  );
}

export const getTopTrimmedEnhetList = async (
  limit = DEFAULT_PRELOAD_LIMIT,
  languageCode: LanguageCode = 'nb',
): Promise<TrimmedEnhet[]> => {
  const list = await getCachedTrimmedEnhetList();
  return sortTrimmedEnhetsForSelector(list, languageCode).slice(0, limit);
};

export const getTrimmedEnhetsByIdsOrSlugs = async (
  idsOrSlugs: readonly string[],
): Promise<TrimmedEnhet[]> => {
  const list = await getCachedTrimmedEnhetList();
  return findTrimmedEnhetsByIdsOrSlugs(list, idsOrSlugs);
};

export const getInitialEnhetsForRequest = async ({
  pathEnhet,
  searchParamsEnhet,
  limit = DEFAULT_PRELOAD_LIMIT,
  languageCode = 'nb',
}: {
  pathEnhet?: string;
  searchParamsEnhet?: string;
  limit?: number;
  languageCode?: LanguageCode;
}): Promise<TrimmedEnhet[]> => {
  try {
    const selected: string[] = [];
    if (pathEnhet) {
      selected.push(pathEnhet);
    }
    if (searchParamsEnhet) {
      selected.push(...parseEnhetParam(searchParamsEnhet));
    }

    // The collapsed selector does not need a preloaded list when nothing is
    // selected. Let the client load it lazily on first expand instead of
    // blocking route transitions on a full enhet fetch.
    if (selected.length === 0) {
      return [];
    }

    const list = await getTrimmedEnhetList();
    const topN = sortTrimmedEnhetsForSelector(list, languageCode).slice(
      0,
      limit,
    );
    const selectedEnhets = findTrimmedEnhetsByIdsOrSlugs(list, selected);
    return mergeTrimmedEnhetsWithAncestors([...topN, ...selectedEnhets], list);
  } catch {
    return [];
  }
};
