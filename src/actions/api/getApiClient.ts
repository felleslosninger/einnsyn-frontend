'use server';

import EInnsynClient from '@digdir/einnsyn-sdk';
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
