'use server';

import {
  type CookieSettings,
  deleteCookieAction,
  getCookie,
  updateCookieAction,
} from './cookieActions';
import { getSettings } from './settingsCookie';

const AUTH_COOKIE_NAME = 'auth';
export type Auth = {
  authProvider: 'eInnsyn' | 'ansattporten';
  authTimestamp: number;
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
};
const defaultContent: Partial<Auth> = {};

// Keep a auth-timestamp cookie as well, that is *not* httpOnly. This is used by the frontend to
// determine if the login status has changed.
const AUTH_TIMESTAMP_COOKIE_NAME = 'auth-timestamp';
export type AuthTimestamp = {
  timestamp: number;
};

/**
 * Wrapper for updating the auth cookie, specifying the cookie name and a low default maxAge.
 *
 * @param authContent
 * @returns
 */
export const updateAuthAction = async (
  authContent: Auth,
  cookieSettings: Partial<CookieSettings> = {},
) => {
  const settings = await getSettings();
  const maxAge =
    cookieSettings.maxAge ??
    (settings.stayLoggedIn
      ? 60 * 60 * 24 * 365 // One year if "stay logged in" is set
      : 60 * 30); // 30 minutes (default)

  // Update the auth-timestamp cookie
  console.log(
    `Update ${AUTH_TIMESTAMP_COOKIE_NAME} with timestamp:`,
    authContent.authTimestamp,
  );
  updateCookieAction(
    AUTH_TIMESTAMP_COOKIE_NAME,
    {
      timestamp: authContent.authTimestamp,
    },
    {
      httpOnly: false, // This should be accessible from the frontend
      maxAge: cookieSettings.maxAge,
    },
  );

  // Update auth cookie
  console.log(`Update ${AUTH_COOKIE_NAME}`);
  return updateCookieAction(AUTH_COOKIE_NAME, authContent, {
    maxAge,
    ...cookieSettings,
    httpOnly: true, // This should not be accessible from the frontend
  });
};

export const getAuth = async () => {
  const authCookieContent = await getCookie<Auth>(AUTH_COOKIE_NAME);
  return {
    ...defaultContent,
    ...authCookieContent,
  } as Auth;
};

export const deleteAuthAction = async () => {
  await deleteCookieAction(AUTH_COOKIE_NAME);
  await deleteCookieAction(AUTH_TIMESTAMP_COOKIE_NAME);
};
