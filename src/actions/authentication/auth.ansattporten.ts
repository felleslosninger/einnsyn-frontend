'use server';

import { redirect } from 'next/navigation';
import * as oidc from 'openid-client';
import { getOrigin } from '~/lib/utils/getOrigin';
import { logger } from '~/lib/utils/logger';
import {
  deleteAuthAction,
  getAuth,
  updateAuthAction,
} from '../cookies/authCookie';
import {
  type CookieSettings,
  deleteCookieAction,
  getCookie,
  updateCookieAction,
} from '../cookies/cookieActions';

const ANSATTPORTEN_URL = process.env.ANSATTPORTEN_URL;
const ANSATTPORTEN_CLIENT_ID = process.env.ANSATTPORTEN_CLIENT_ID;
const ANSATTPORTEN_CLIENT_SECRET = process.env.ANSATTPORTEN_CLIENT_SECRET;
const ANSATTPORTEN_AUTH_DETAILS = process.env.ANSATTPORTEN_AUTH_DETAILS;

const ANSATTPORTEN_COOKIE_NAME = 'ansattporten';

if (!ANSATTPORTEN_URL) {
  throw new Error('Missing environment variable for Ansattporten URL');
}
if (!ANSATTPORTEN_CLIENT_ID) {
  throw new Error('Missing environment variable for Ansattporten client ID');
}
if (!ANSATTPORTEN_CLIENT_SECRET) {
  throw new Error(
    'Missing environment variable for Ansattporten client secret',
  );
}
if (!ANSATTPORTEN_AUTH_DETAILS) {
  throw new Error(
    'Missing environment variable for Ansattporten authorization details',
  );
}

// A temporary cookie used during the authentication flow
type AnsattportenCookieContent = {
  // The PKCE code verifier
  codeVerifier: string;
  // The OIDC nonce
  nonce: string;
  // The URL the user was on before starting authentication
  originUrl: string;
  // The OIDC state parameter
  state: string;
};

// Cache for the OIDC configuration
let oidcConfigCache: Promise<oidc.Configuration> | null = null;
let lastConfigRefresh = 0;
const CONFIG_REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hour

/**
 * Get the OIDC configuration, with caching and automatic refresh
 */
async function getOidcConfig(): Promise<oidc.Configuration> {
  const now = Date.now();

  // If we don't have a cached config or it's been more than an hour, refresh it
  if (!oidcConfigCache || now - lastConfigRefresh > CONFIG_REFRESH_INTERVAL) {
    oidcConfigCache = discoverOidcConfig();
    lastConfigRefresh = now;
  }

  return oidcConfigCache;
}

/**
 * Discover the Ansattporten OIDC configuration.
 *
 * @returns configuration object
 */
async function discoverOidcConfig() {
  const config = await oidc.discovery(
    new URL(ANSATTPORTEN_URL),
    ANSATTPORTEN_CLIENT_ID,
    undefined,
    oidc.ClientSecretPost(ANSATTPORTEN_CLIENT_SECRET),
  );
  return config;
}

async function getCallbackUri() {
  return new URL('/auth/ansattporten/callback', await getOrigin()).href;
}

/**
 * A Server Action to initiate the Ansattporten login process.
 *
 * @param formData
 */
export async function ansattportenAuthAction(
  formData: FormData,
): Promise<void> {
  const originUrl = formData.get('originUrl') as string;
  if (!originUrl) {
    throw new Error('Missing originUrl in form data');
  }
  const authorizationUrl = await buildAuthorizationUrl(originUrl);
  redirect(authorizationUrl.href);
}

/**
 * Build the authorization URL for Ansattporten.
 *
 * @returns The authorization URL
 */
const buildAuthorizationUrl = async (originUrl: string) => {
  const oidcConfig = await getOidcConfig();
  const codeVerifier = oidc.randomPKCECodeVerifier();
  const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);
  const nonce = oidc.randomNonce();
  const state = oidc.randomState();

  // Store codeVerifier and state in a cookie
  await updateAnsattportenCookie({
    codeVerifier,
    nonce,
    originUrl,
    state,
  });

  // const authorizationDetails =
  //   '[{"type":"ansattporten:altinn:service","resource":"urn:altinn:resource:2480:40","representation_is_required":"true"}]';
  const authorizationDetails = ANSATTPORTEN_AUTH_DETAILS;
  const callbackUri = await getCallbackUri();

  return oidc.buildAuthorizationUrl(oidcConfig, {
    acr_values: 'substantial',
    authorization_details: authorizationDetails,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    redirect_uri: callbackUri,
    response_type: 'code',
    nonce,
    scope: 'openid profile',
    state,
  });
};

/**
 * Handle the callback from Ansattporten.
 */
export const handleCallback = async (request: Request) => {
  // Get codeVerifier and state from the session
  const { codeVerifier, nonce, originUrl, state } =
    (await getAnsattportenCookie()) ?? {};
  if (!codeVerifier) {
    throw new Error('Missing codeVerifier in cookie');
  }
  if (!nonce) {
    throw new Error('Missing nonce in cookie');
  }
  if (!originUrl) {
    throw new Error('Missing originUrl in cookie');
  }
  if (!state) {
    throw new Error('Missing state in cookie');
  }

  const oidcConfig = await getOidcConfig();

  try {
    // Construct the correct callback URL, in case we're proxied
    const possiblyProxiedUrl = new URL(request.url);
    const origin = await getOrigin();
    const correctedUrl = new URL(
      possiblyProxiedUrl.pathname + possiblyProxiedUrl.search,
      origin,
    );

    const tokens = await oidc.authorizationCodeGrant(oidcConfig, correctedUrl, {
      pkceCodeVerifier: codeVerifier,
      expectedState: state,
      expectedNonce: nonce,
    });

    await updateAuthWithTokens(tokens, Date.now());
  } catch (error) {
    logger.warn('OIDC Authorization Code Grant failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (
      error instanceof oidc.AuthorizationResponseError &&
      error.error === 'access_denied'
    ) {
      // User cancelled authentication at the provider
    } else if (error instanceof oidc.AuthorizationResponseError) {
      throw new Error(
        `Authentication failed during callback: ${error.error} ${error.error_description}`,
      );
    } else {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Authentication failed during callback: ${errorMessage}`);
    }
  } finally {
    // Clean up the Ansattporten cookie
    await deleteAnsattportenCookie();
  }

  return originUrl;
};

/**
 *
 * @param content
 * @returns
 */
const updateAnsattportenCookie = async (content: AnsattportenCookieContent) => {
  return await updateCookieAction<AnsattportenCookieContent>(
    ANSATTPORTEN_COOKIE_NAME,
    content,
    {
      maxAge: 60 * 30,
    },
  );
};

/**
 * Get the Ansattporten cookie.
 *
 * @returns
 */
const getAnsattportenCookie = async () => {
  return await getCookie<AnsattportenCookieContent>(ANSATTPORTEN_COOKIE_NAME);
};

/**
 *
 * @returns
 */
const deleteAnsattportenCookie = async () => {
  return await deleteCookieAction(ANSATTPORTEN_COOKIE_NAME);
};

/**
 * Helper function to attempt token refresh.
 */
export async function attemptTokenRefresh(refreshToken: string): Promise<void> {
  try {
    const oidcConfig = await getOidcConfig();
    const tokens = await oidc.refreshTokenGrant(oidcConfig, refreshToken);
    await updateAuthWithTokens(tokens);
  } catch (error) {
    logger.error('Failed to refresh token', {
      error: error instanceof Error ? error.message : String(error),
    });
    await deleteAuthAction();
  }
}

/**
 * Redirect the user to the Ansattporten logout URL.
 */
export async function ansattportenEndSessionAction(): Promise<void> {
  const endSessionUrl = await buildEndSessionUrl();
  if (endSessionUrl !== undefined) {
    redirect(endSessionUrl.href);
  }
}

/**
 * Build the end session URL for Ansattporten.
 */
export const buildEndSessionUrl = async () => {
  const authSession = await getAuth();
  if (!authSession?.accessToken) {
    return;
  }

  const oidcConfig = await getOidcConfig();
  const origin = await getOrigin();
  const endSessionUrl = oidc.buildEndSessionUrl(oidcConfig, {
    post_logout_redirect_uri: origin,
  });

  await deleteAuthAction();
  await deleteAnsattportenCookie();

  return endSessionUrl;
};

async function updateAuthWithTokens(
  tokens: oidc.TokenEndpointResponse & oidc.TokenEndpointResponseHelpers,
  timestamp?: number,
) {
  if (!tokens.access_token) {
    throw new Error('Authentication failed: No access_token received.');
  }

  // Set cookie's maxAge to the refresh token's expires_in value
  const cookieSettings: Partial<CookieSettings> = {};
  const refreshTokenExpiresIn =
    typeof tokens.refresh_token_expires_in === 'number'
      ? tokens.refresh_token_expires_in
      : undefined;
  if (refreshTokenExpiresIn) {
    cookieSettings.maxAge = refreshTokenExpiresIn;
  }

  // Update auth cookie with the new tokens
  await updateAuthAction(
    {
      authTimestamp: timestamp ?? (await getAuth()).authTimestamp,
      authProvider: 'ansattporten',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt:
        tokens.expires_in === undefined
          ? undefined
          : Math.round(
              (new Date().getTime() + tokens.expires_in * 1000) / 1000,
            ),
    },
    cookieSettings,
  );
}
