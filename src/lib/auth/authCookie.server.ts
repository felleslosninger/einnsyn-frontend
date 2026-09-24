import 'server-only';

import {
  type CookieSettings,
  deleteCookie,
  getCookie,
  updateCookie,
} from '~/lib/cookies/cookies.server';
import { getSettings } from '~/lib/settings/settings.server';
import {
  AUTH_COOKIE_NAME,
  AUTH_TIMESTAMP_COOKIE_NAME,
  type Auth,
} from './auth';

const defaultContent: Partial<Auth> = {};

/** Writes both the httpOnly auth cookie and the timestamp the client watches. */
export const updateAuth = async (
  authContent: Auth,
  cookieSettings: Partial<CookieSettings> = {},
) => {
  const settings = await getSettings();
  const maxAge =
    cookieSettings.maxAge ??
    (settings.stayLoggedIn
      ? 60 * 60 * 24 * 365 // One year if "stay logged in" is set
      : 60 * 30); // 30 minutes (default)

  updateCookie(
    AUTH_TIMESTAMP_COOKIE_NAME,
    {
      timestamp: authContent.authTimestamp,
    },
    {
      httpOnly: false, // This should be accessible from the frontend
      maxAge: cookieSettings.maxAge,
    },
  );

  return updateCookie(AUTH_COOKIE_NAME, authContent, {
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

export const deleteAuth = async () => {
  await deleteCookie(AUTH_COOKIE_NAME);
  await deleteCookie(AUTH_TIMESTAMP_COOKIE_NAME);
};
