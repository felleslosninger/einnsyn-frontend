'use server';

import { EInnsynError } from '@digdir/einnsyn-sdk';
import { redirect } from 'next/navigation';
import { cachedApiClient } from '~/actions/api/getApiClient';
import { cachedAuthInfo } from '~/actions/authentication/auth';
import { deleteAuthAction } from '~/actions/cookies/authCookie';

export type ProfileActionState = {
  success?: boolean;
  error?: string;
};

export async function updateEmailAction(
  prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const email = (formData.get('email') as string)?.trim();
  if (!email) return { error: 'missingFields' };

  const authInfo = await cachedAuthInfo();
  if (!authInfo?.id) return { error: 'unauthorized' };

  try {
    const api = await cachedApiClient();
    await api.bruker.update(authInfo.id, { email });
    return { success: true };
  } catch (error) {
    if (error instanceof EInnsynError) {
      // validationError here always means malformed email (only field we send)
      if (error.type === 'validationError') return { error: 'invalidEmail' };
      return { error: error.type };
    }
    return { error: 'unknownError' };
  }
}

export async function updatePasswordAction(
  prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const oldPassword = formData.get('oldPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!oldPassword || !newPassword) return { error: 'missingFields' };
  if (newPassword !== confirmPassword) return { error: 'passwordMismatch' };
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9\W]).{8,}$/.test(newPassword))
    return { error: 'invalidPassword' };

  const authInfo = await cachedAuthInfo();
  if (!authInfo?.id) return { error: 'unauthorized' };

  try {
    const api = await cachedApiClient();
    await api.bruker.updatePassword(authInfo.id, { oldPassword, newPassword });
    return { success: true };
  } catch (error) {
    if (error instanceof EInnsynError) {
      if (
        error.type === 'authorizationError' ||
        error.type === 'badRequest' ||
        error.type === 'notFound'
      )
        return { error: 'wrongPassword' };
      if (error.type === 'validationError') return { error: 'invalidPassword' };
      return { error: error.type };
    }
    return { error: 'unknownError' };
  }
}

export async function deleteAccountAction(
  prevState: ProfileActionState,
  _formData: FormData,
): Promise<ProfileActionState> {
  const authInfo = await cachedAuthInfo();
  if (!authInfo?.id) return { error: 'unauthorized' };

  try {
    const api = await cachedApiClient();
    await api.bruker.delete(authInfo.id);
    await deleteAuthAction();
  } catch (error) {
    if (error instanceof EInnsynError) return { error: error.type };
    return { error: 'unknownError' };
  }

  redirect('/');
}
