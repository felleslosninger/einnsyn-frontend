'use server';

import EInnsynClient from '@digdir/einnsyn-sdk';
import { getAuth } from '../cookies/authCookie';
import { cache } from 'react';

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
