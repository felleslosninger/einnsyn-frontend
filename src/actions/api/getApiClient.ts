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

// Unauthenticated client for the process-wide enhet list cache. A shared cache
// entry must not carry per-user credentials, or it would leak auth across
// sessions.
export const getPublicApiClient = async () => {
  return new EInnsynClient({
    appInfo: 'eInnsyn frontend',
    baseUrl: process.env.API_URL,
  });
};

export const cachedPublicApiClient = cache(getPublicApiClient);
