'use server';

import {
  AuthenticationError,
  ConflictError,
  EInnsynError,
} from '@digdir/einnsyn-sdk';
import { redirect } from 'next/navigation';
import { cachedApiClient } from '~/actions/api/getApiClient';
import { cachedAuthInfo } from '~/actions/authentication/auth';
import { deleteAuthAction } from '~/actions/cookies/authCookie';

export type ProfileActionState = {
  success?: boolean;
  error?: string;
  errorMessage?: string;
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
    if (error instanceof ConflictError) {
      return { error: 'emailTaken' };
    }
    if (error instanceof EInnsynError) {
      return { error: error.type, errorMessage: error.message };
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

  const authInfo = await cachedAuthInfo();
  if (!authInfo?.id) return { error: 'unauthorized' };

  try {
    const api = await cachedApiClient();
    await api.bruker.updatePassword(authInfo.id, { oldPassword, newPassword });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return { error: 'wrongPassword' };
    }
    if (error instanceof EInnsynError) {
      return { error: error.type, errorMessage: error.message };
    }
    return { error: 'unknownError' };
  }
}

export async function deactivateAccountAction(
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
    if (error instanceof EInnsynError) {
      return { error: error.type, errorMessage: error.message };
    }
    return { error: 'unknownError' };
  }

  redirect('/');
}
