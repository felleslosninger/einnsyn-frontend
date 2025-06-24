'use server';

import type { AuthInfo, Bruker, Enhet } from '@digdir/einnsyn-sdk';
import { cache } from 'react';
import { cachedApiClient } from '../api/getApiClient';
import { deleteAuthAction, getAuth } from '../cookies/authCookie';
import * as ansattporten from './auth.ansattporten';

export type ExtendedAuthInfo = AuthInfo & {
  enhet?: Enhet;
  bruker?: Bruker;
};

export const cachedAuthInfo = cache(getAuthInfo);
export async function getAuthInfo() {
  const auth = await getAuth();

  if (!auth?.apiKey && !auth?.accessToken) {
    return undefined;
  }

  try {
    const apiClient = await cachedApiClient();
    const authInfo: ExtendedAuthInfo = await apiClient.authinfo.get();
    if (authInfo.type === 'Enhet' && authInfo.id) {
      authInfo.enhet = await apiClient.enhet.get(authInfo.id);
    }
    if (authInfo.type === 'Bruker' && authInfo.id) {
      authInfo.bruker = await apiClient.bruker.get(authInfo.id);
    }
    return authInfo;
  } catch (error) {
    console.error('Failed to fetch auth info:', error);
    return undefined;
  }
}

/**
 * Update the access token if it is expired or nearing expiry.
 */
export const maybeRefreshToken = async (): Promise<void> => {
  const authSession = await getAuth();

  if (!authSession?.accessToken) {
    // No token available
    return;
  }

  // Check if token is valid
  const nowInSeconds = Date.now() / 1000;
  if (
    authSession.expiresAt &&
    authSession.expiresAt > nowInSeconds + 120 // 120 seconds buffer
  ) {
    return;
  }

  // Token is expired or nearing expiry, or expiresAt is not set
  if (!authSession.refreshToken) {
    console.warn(
      'Access token expired/invalid, but no refresh token available. Clearing auth session.',
    );
    await deleteAuthAction();
    return;
  }

  if (authSession.authProvider === 'ansattporten') {
    console.log('Attempting to refresh Ansattporten token');
    await ansattporten.attemptTokenRefresh(authSession.refreshToken);
    console.log('Ansattporten token refreshed successfully');
  } else if (authSession.authProvider === 'eInnsyn') {
    // await
  }
};

export async function logout(): Promise<void> {
  const authSession = await getAuth();

  if (authSession.authProvider === 'ansattporten') {
    await ansattporten.ansattportenEndSessionAction();
  } else if (authSession.authProvider === 'eInnsyn') {
    // TODO: Implement eInnsyn logout
  }
}
