'use server';

import { validateUsername } from '~/lib/utils/validators';
import { updateAuthAction } from '../cookies/authCookie';
import { updateSettingsAction } from '../cookies/settingsCookie';

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

type LoginState = {
  success?: boolean;
  valid?: {
    username: boolean;
    password: boolean;
  };
  error?: string;
  message?: string;
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

export const eInnsynLoginAction = async (
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
      await updateSettingsAction({
        stayLoggedIn,
      });
      await updateAuthAction({
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
  } catch (error) {
    return {
      ...prevState,
      valid,
      error: 'NetworkError',
      message: 'A network error occurred. Please try again later.',
    };
  }
};
