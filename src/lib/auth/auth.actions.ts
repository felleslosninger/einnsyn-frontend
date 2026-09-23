'use server';

import { startAnsattportenLogin } from './ansattporten.server';
import type { LoginState } from './auth';
import { endSession } from './auth.server';
import { eInnsynLogin } from './einnsyn.server';

// Every export here is a publicly callable endpoint, so this file holds only
// what a form or client component actually submits to. Server-side callers use
// the `.server` modules directly.

/** `<form action>` on the Ansattporten login button. */
export async function ansattportenAuthAction(
  formData: FormData,
): Promise<void> {
  const returnPath = formData.get('returnPath');
  await startAnsattportenLogin(
    typeof returnPath === 'string' ? returnPath : '/',
  );
}

/** `useActionState` on the eInnsyn login form. */
export async function eInnsynLoginAction(
  prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  return await eInnsynLogin(prevState, formData);
}

/** `<form action>` on the log out button. */
export async function logoutAction(): Promise<void> {
  await endSession();
}
