import 'server-only';

import { redirect } from 'next/navigation';
import * as oidc from 'openid-client';
import {
  type CookieSettings,
  deleteCookie,
  getCookie,
  updateCookie,
} from '~/lib/cookies/cookies.server';
import { getOrigin } from '~/lib/utils/getOrigin';
import { logger } from '~/lib/utils/logger';
import { deleteAuth, getAuth, updateAuth } from './authCookie.server';

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
  // Path on this site the user was on before starting authentication
  returnPath: string;
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

// Nothing absolute resolves against this base, so an input that carries its own
// origin - or none, like `javascript:` - is rejected instead of being redirected to.
const RETURN_PATH_BASE = 'https://return-path.invalid';

/**
 * Reduce a caller-supplied return path to a path on this site. It arrives from a
 * form field and ends up in a redirect after login, so it is never trusted as-is.
 */
function toSafeReturnPath(returnPath: string): string {
  try {
    const url = new URL(returnPath, RETURN_PATH_BASE);
    return url.origin === RETURN_PATH_BASE
      ? url.pathname + url.search + url.hash
      : '/';
  } catch {
    return '/';
  }
}

/** Send the visitor to Ansattporten to authenticate. Does not return. */
export async function startAnsattportenLogin(
  returnPath: string,
): Promise<void> {
  const authorizationUrl = await buildAuthorizationUrl(
    toSafeReturnPath(returnPath),
  );
  redirect(authorizationUrl.href);
}

/**
 * Build the authorization URL for Ansattporten.
 *
 * @returns The authorization URL
 */
const buildAuthorizationUrl = async (returnPath: string) => {
  const oidcConfig = await getOidcConfig();
  const codeVerifier = oidc.randomPKCECodeVerifier();
  const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);
  const nonce = oidc.randomNonce();
  const state = oidc.randomState();

  // Store codeVerifier and state in a cookie
  await updateAnsattportenCookie({
    codeVerifier,
    nonce,
    returnPath,
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
  const { codeVerifier, nonce, returnPath, state } =
    (await getAnsattportenCookie()) ?? {};
  if (!codeVerifier) {
    throw new Error('Missing codeVerifier in cookie');
  }
  if (!nonce) {
    throw new Error('Missing nonce in cookie');
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

  return returnPath ?? '/';
};

const updateAnsattportenCookie = async (content: AnsattportenCookieContent) => {
  return await updateCookie<AnsattportenCookieContent>(
    ANSATTPORTEN_COOKIE_NAME,
    content,
    {
      maxAge: 60 * 30,
    },
  );
};

const getAnsattportenCookie = async () => {
  return await getCookie<AnsattportenCookieContent>(ANSATTPORTEN_COOKIE_NAME);
};

const deleteAnsattportenCookie = async () => {
  return await deleteCookie(ANSATTPORTEN_COOKIE_NAME);
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
    await deleteAuth();
  }
}

/**
 * Redirect the user to the Ansattporten logout URL.
 */
export async function ansattportenEndSession(): Promise<void> {
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

  await deleteAuth();
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
  await updateAuth(
    {
      authTimestamp: timestamp ?? (await getAuth()).authTimestamp,
      authProvider: 'ansattporten',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt:
        tokens.expires_in === undefined
          ? undefined
          : Math.round((Date.now() + tokens.expires_in * 1000) / 1000),
    },
    cookieSettings,
  );
}
