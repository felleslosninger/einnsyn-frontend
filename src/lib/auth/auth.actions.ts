'use server';

import { startAnsattportenLogin } from './ansattporten.server';
import type { LoginState, PasswordResetState } from './auth';
import { endSession } from './auth.server';
import { eInnsynLogin, requestPasswordReset } from './einnsyn.server';

// Every export here is a publicly callable endpoint, so this file holds only
// what a form or client component actually submits to. Server-side callers use
// the `.server` modules directly.

/** `<form action>` on the Ansattporten login button. */
export async function ansattportenAuthAction(
  formData: FormData,
): Promise<void> {
  const originUrl = formData.get('originUrl') as string;
  if (!originUrl) {
    throw new Error('Missing originUrl in form data');
  }
  await startAnsattportenLogin(originUrl);
}

/** `useActionState` on the eInnsyn login form. */
export async function eInnsynLoginAction(
  prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  return await eInnsynLogin(prevState, formData);
}

/** `useActionState` on the forgotten-password form. */
export async function requestPasswordResetAction(
  prevState: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  return await requestPasswordReset(prevState, formData);
}

/** `<form action>` on the log out button. */
export async function logoutAction(): Promise<void> {
  await endSession();
}
