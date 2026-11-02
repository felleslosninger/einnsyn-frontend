import type { AuthInfo, Bruker, Enhet } from '@digdir/einnsyn-sdk';

export const AUTH_COOKIE_NAME = 'auth';

// Not httpOnly: the client reads this one to notice that the login state
// changed. It carries no credentials, only the timestamp of the last login.
export const AUTH_TIMESTAMP_COOKIE_NAME = 'auth-timestamp';

export type AuthProvider = 'eInnsyn' | 'ansattporten';

export type Auth = {
  authProvider: AuthProvider;
  authTimestamp: number;
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  refreshExpiresAt?: number;
  renewedAt?: number;
};

export type AuthTimestamp = {
  timestamp: number;
};

export type ExtendedAuthInfo = AuthInfo & {
  enhet?: Enhet;
  bruker?: Bruker;
};

export type AuthError =
  | 'authenticationError'
  | 'invalidPassword'
  | 'invalidUsername'
  | 'passwordMismatch'
  | 'unknownError';

/** The state `useActionState` carries between password reset requests. */
export type PasswordResetState = {
  sent?: boolean;
  error?: AuthError;
};

/** The state `useActionState` carries between registration attempts. */
export type RegisterState = {
  sent?: boolean;
  error?: AuthError;
};

/** The state `useActionState` carries between login attempts. */
export type LoginState = {
  success?: boolean;
  error?: AuthError;
};
