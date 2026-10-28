'use server';

import { EInnsynError } from '@digdir/einnsyn-sdk';
import { redirect } from 'next/navigation';
import { cachedApiClient } from '~/lib/api/api.server';
import { cachedAuthInfo, endSession } from '~/lib/auth/auth.server';
import { validatePassword } from '~/lib/utils/validators';

const API_ERRORS = [
  'authenticationError',
  'authorizationError',
  'badRequest',
  'notFound',
  'tooManyRequests',
] as const;

export type ProfileError =
  | (typeof API_ERRORS)[number]
  | 'internalServerError'
  | 'invalidEmail'
  | 'invalidPassword'
  | 'missingFields'
  | 'passwordMismatch'
  | 'wrongPassword';

export type ProfileActionState = {
  success?: boolean;
  error?: ProfileError;
};

function toProfileError(error: unknown): ProfileError {
  if (error instanceof EInnsynError) {
    const apiError = API_ERRORS.find((type) => type === error.type);
    if (apiError) return apiError;
  }
  return 'internalServerError';
}

export async function updateEmailAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const email = (formData.get('email') as string)?.trim();
  if (!email) return { error: 'missingFields' };

  const authInfo = await cachedAuthInfo();
  if (!authInfo?.id) return { error: 'authenticationError' };

  try {
    const api = await cachedApiClient();
    await api.bruker.update(authInfo.id, { email });
    return { success: true };
  } catch (error) {
    if (error instanceof EInnsynError && error.type === 'validationError')
      return { error: 'invalidEmail' };
    return { error: toProfileError(error) };
  }
}

export async function updatePasswordAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const oldPassword = formData.get('oldPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!oldPassword || !newPassword) return { error: 'missingFields' };
  if (newPassword !== confirmPassword) return { error: 'passwordMismatch' };
  if (!validatePassword(newPassword)) return { error: 'invalidPassword' };

  const authInfo = await cachedAuthInfo();
  if (!authInfo?.id) return { error: 'authenticationError' };

  try {
    const api = await cachedApiClient();
    await api.bruker.updatePassword(authInfo.id, { oldPassword, newPassword });
    return { success: true };
  } catch (error) {
    if (error instanceof EInnsynError) {
      // The backend answers 404 when the old password is wrong, and 400 when
      // it doesn't meet the password rules.
      if (error.type === 'notFound' || error.type === 'badRequest')
        return { error: 'wrongPassword' };
      if (error.type === 'validationError') return { error: 'invalidPassword' };
    }
    return { error: toProfileError(error) };
  }
}

export async function deleteAccountAction(
  _prevState: ProfileActionState,
  _formData: FormData,
): Promise<ProfileActionState> {
  const authInfo = await cachedAuthInfo();
  if (!authInfo?.id) return { error: 'authenticationError' };

  try {
    const api = await cachedApiClient();
    await api.bruker.delete(authInfo.id);
  } catch (error) {
    return { error: toProfileError(error) };
  }

  // redirect() throws, so it has to stay outside the try/catch above.
  await endSession();
  redirect('/');
}
