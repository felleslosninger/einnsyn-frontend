import 'server-only';

import { updateSettings } from '~/lib/settings/settings.server';
import { logger } from '~/lib/utils/logger';
import { validateUsername } from '~/lib/utils/validators';
import type { LoginState } from './auth';
import { deleteAuth, getAuth, updateAuth } from './authCookie.server';

const API_URL = process.env.API_URL;

type ApiTokenResponse = {
  token: string;
  refreshToken: string;
  expiresIn: number;
};

type ApiErrorResponse = {
  type: string;
  message: string;
};

const isApiErrorResponse = (
  response: ApiErrorResponse | ApiTokenResponse,
): response is ApiErrorResponse => {
  return (response as ApiErrorResponse).type !== undefined;
};

const isApiTokenResponse = (
  response: ApiErrorResponse | ApiTokenResponse,
): response is ApiTokenResponse => {
  return (response as ApiTokenResponse).token !== undefined;
};

/** `expiresIn` is in seconds, as is `Auth.expiresAt`. */
const toExpiresAt = (expiresIn: number) =>
  Math.round(Date.now() / 1000) + expiresIn;

export const eInnsynLogin = async (
  prevState: LoginState,
  formData: FormData,
): Promise<LoginState> => {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const stayLoggedIn = formData.get('stayLoggedIn') === 'checked';

  const valid = {
    username: !!username && validateUsername(username),
    password: !!password,
  };

  // Return early if the form is invalid
  if (!valid.username || !valid.password) {
    return {
      ...prevState,
      valid,
    };
  }

  // Log in to backend
  const authenticationResponse = await fetch(`${API_URL}/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  try {
    const responseData: ApiErrorResponse | ApiTokenResponse =
      await authenticationResponse.json();

    // Successful login
    if (isApiTokenResponse(responseData)) {
      await updateSettings({
        stayLoggedIn,
      });
      await updateAuth({
        authProvider: 'eInnsyn',
        authTimestamp: Date.now(),
        accessToken: responseData.token,
        refreshToken: responseData.refreshToken,
        expiresAt: toExpiresAt(responseData.expiresIn),
      });
      return {
        ...prevState,
        success: true,
        valid,
      };
    }

    // Invalid username or password
    if (isApiErrorResponse(responseData)) {
      return {
        ...prevState,
        valid,
        error: responseData.type,
        message: responseData.message,
      };
    }

    // Unknown response
    return {
      ...prevState,
      valid,
      error: 'UnknownError',
      message: 'An unknown error occurred.',
    };
  } catch (_error) {
    return {
      ...prevState,
      valid,
      error: 'NetworkError',
      message: 'A network error occurred. Please try again later.',
    };
  }
};

/**
 * Trade the refresh token for a new token pair. Only the API rejecting it ends
 * the session; on any other failure the next request tries again.
 */
export const attemptTokenRefresh = async (
  refreshToken: string,
): Promise<void> => {
  let responseData: ApiErrorResponse | ApiTokenResponse;
  try {
    const response = await fetch(`${API_URL}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
    responseData = await response.json();
  } catch (error) {
    logger.error('Failed to refresh eInnsyn token', error);
    return;
  }

  if (isApiTokenResponse(responseData)) {
    await updateAuth({
      authProvider: 'eInnsyn',
      authTimestamp: (await getAuth()).authTimestamp,
      accessToken: responseData.token,
      refreshToken: responseData.refreshToken,
      expiresAt: toExpiresAt(responseData.expiresIn),
    });
    return;
  }

  if (responseData.type === 'authenticationError') {
    logger.debug('eInnsyn refresh token rejected, ending the session');
    await deleteAuth();
    return;
  }
  logger.error('Failed to refresh eInnsyn token', responseData);
};
