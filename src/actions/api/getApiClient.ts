'use server';

import EInnsynClient from '@digdir/einnsyn-sdk';
import { cache } from 'react';
import { getAuth } from '../cookies/authCookie';

export const getApiClient = async () => {
  const auth = await getAuth();

  return new EInnsynClient({
    appInfo: 'eInnsyn frontend',
    baseUrl: process.env.API_URL,
    jwt: auth?.accessToken,
    apiKey: auth?.apiKey,
  });
};

export const cachedApiClient = cache(getApiClient);

// Unauthenticated client for use with `unstable_cache`. A cached request must
// not carry per-user credentials, or the cache entry would leak auth across
// sessions.
export const getPublicApiClient = async () => {
  return new EInnsynClient({
    appInfo: 'eInnsyn frontend',
    baseUrl: process.env.API_URL,
  });
};

export const cachedPublicApiClient = cache(getPublicApiClient);
