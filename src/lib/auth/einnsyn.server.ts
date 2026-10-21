import 'server-only';

import { NotFoundError } from '@digdir/einnsyn-sdk';
import { getPublicApiClient } from '~/lib/api/api.server';
import { updateSettings } from '~/lib/settings/settings.server';
import { logger } from '~/lib/utils/logger';
import { validateUsername } from '~/lib/utils/validators';
import type { LoginState, PasswordResetState } from './auth';
import { updateAuth } from './authCookie.server';

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
 * Ask the API to e-mail a password reset link. An address without an account
 * gets the same answer, so the form doesn't reveal who has one.
 */
export const requestPasswordReset = async (
  _prevState: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> => {
  const username = formData.get('username');
  if (!validateUsername(username)) {
    return { error: 'invalidUsername' };
  }

  try {
    const api = await getPublicApiClient();
    // The SDK puts the id into the path as is.
    const id = encodeURIComponent(username).replaceAll('%40', '@');
    await api.bruker.requestPasswordReset(id);
  } catch (error) {
    if (!(error instanceof NotFoundError)) {
      logger.error('Failed to request a password reset', error);
      return { error: 'UnknownError' };
    }
  }

  return { sent: true };
};
