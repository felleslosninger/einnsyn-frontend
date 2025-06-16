'use server';

import type { AuthInfo, Bruker, Enhet } from '@digdir/einnsyn-sdk';
import { getApiClient } from '../api/getApiClient';
import { deleteAuth, getAuth } from '../cookies/authCookie';
import * as ansattporten from './auth.ansattporten';
import * as eInnsyn from './auth.eInnsyn';

export type ExtendedAuthInfo = AuthInfo & {
  enhet?: Enhet;
  bruker?: Bruker;
};

export async function getAuthInfo() {
  const auth = await getAuth();

  if (!auth?.apiKey && !auth?.accessToken) {
    return undefined;
  }

  try {
    const apiClient = await getApiClient();
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
    await deleteAuth();
    return;
  }

  if (authSession.authProvider === 'ansattporten') {
    await ansattporten.attemptTokenRefresh(authSession.refreshToken);
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
