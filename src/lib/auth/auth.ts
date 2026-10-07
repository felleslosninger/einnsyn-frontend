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
};

export type AuthTimestamp = {
  timestamp: number;
};

export type ExtendedAuthInfo = AuthInfo & {
  enhet?: Enhet;
  bruker?: Bruker;
};

/** The state `useActionState` carries between login attempts. */
export type LoginState = {
  success?: boolean;
  valid?: {
    username: boolean;
    password: boolean;
  };
  error?: string;
  message?: string;
};
