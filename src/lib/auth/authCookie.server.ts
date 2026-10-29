import 'server-only';

import {
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

/** Seconds between renewals, so not every response carries the cookie. */
const RENEWAL_INTERVAL = 60;

/** Ends after 30 idle minutes: the cookie is renewed while the session is in use. */
const IDLE_LIFETIME = { maxAge: 60 * 30, idleTimeout: true };

/**
 * Lasts as long as the refresh token. If its expiry is unknown, the cookie lasts
 * a year and a failed refresh ends the session.
 */
const refreshTokenLifetime = (auth: Auth) => ({
  maxAge: auth.refreshExpiresAt
    ? auth.refreshExpiresAt - Math.round(Date.now() / 1000)
    : 60 * 60 * 24 * 365,
  idleTimeout: false,
});

const getLifetime = (auth: Auth, stayLoggedIn: boolean) => {
  // "Stay logged in" is only offered for eInnsyn logins
  if (auth.authProvider === 'ansattporten') {
    return refreshTokenLifetime(auth);
  }
  return stayLoggedIn ? refreshTokenLifetime(auth) : IDLE_LIFETIME;
};

/** Writes both the httpOnly auth cookie and the timestamp the client watches. */
export const updateAuth = async (authContent: Auth) => {
  const { stayLoggedIn } = await getSettings();
  const { maxAge } = getLifetime(authContent, stayLoggedIn);

  updateCookie(
    AUTH_TIMESTAMP_COOKIE_NAME,
    {
      timestamp: authContent.authTimestamp,
    },
    {
      httpOnly: false, // This should be accessible from the frontend
      maxAge,
    },
  );

  return updateCookie(
    AUTH_COOKIE_NAME,
    { ...authContent, renewedAt: Math.round(Date.now() / 1000) },
    {
      maxAge,
      httpOnly: true, // This should not be accessible from the frontend
    },
  );
};

/**
 * Restart the lifetime of a session with an idle timeout while it is in use,
 * so it runs from the last request rather than from login.
 */
export const maybeRenewAuthCookie = async (auth: Auth): Promise<void> => {
  const nowInSeconds = Math.round(Date.now() / 1000);
  if (auth.renewedAt && auth.renewedAt > nowInSeconds - RENEWAL_INTERVAL) {
    return;
  }
  const { stayLoggedIn } = await getSettings();
  if (getLifetime(auth, stayLoggedIn).idleTimeout) {
    await updateAuth(auth);
  }
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
