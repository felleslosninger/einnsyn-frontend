import assert from 'node:assert';
import { afterEach, before, beforeEach, describe, mock, test } from 'node:test';
import { pathToFileURL } from 'node:url';
import type { Auth } from './auth';

const toModuleUrl = (modulePath: string) => pathToFileURL(modulePath).href;

let storedAuthSession: Partial<Auth> = {};
const updateAuthMock = mock.fn(async (authSession: Auth) => {
  storedAuthSession = authSession;
});
const deleteAuthMock = mock.fn(async () => {
  storedAuthSession = {};
});

// The real cookie helpers need a Next.js request scope.
mock.module(toModuleUrl('src/lib/auth/authCookie.server.ts'), {
  namedExports: {
    getAuth: async () => storedAuthSession,
    updateAuth: updateAuthMock,
    deleteAuth: deleteAuthMock,
  },
});
mock.module(toModuleUrl('src/lib/settings/settings.server.ts'), {
  namedExports: {
    getSettings: async () => ({}),
    updateSettings: async () => {},
  },
});
mock.module(toModuleUrl('src/lib/utils/logger.ts'), {
  namedExports: {
    logger: { debug: () => {}, error: () => {}, warn: () => {} },
  },
});

let einnsynAuth: typeof import('./einnsyn.server');
before(async () => {
  einnsynAuth = await import('./einnsyn.server');
});

const originalFetch = globalThis.fetch;
let requestBodies: unknown[] = [];

function mockFetchResponse(createResponse: () => Promise<Response>) {
  globalThis.fetch = async (_requestUrl, requestOptions) => {
    requestBodies.push(JSON.parse(String(requestOptions?.body)));
    return createResponse();
  };
}

// Unsigned: the frontend only reads the claims.
const createUnsignedJwt = (claims: object) =>
  `header.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`;

const refreshTokenExpiresAt = 2_000_000_000;
const issuedRefreshToken = createUnsignedJwt({ exp: refreshTokenExpiresAt });

const createTokenResponse = (
  accessTokenLifetimeSeconds = 3600,
  responseRefreshToken = issuedRefreshToken,
) =>
  Response.json({
    token: 'access-2',
    refreshToken: responseRefreshToken,
    expiresIn: accessTokenLifetimeSeconds,
  });

const currentTimeInSeconds = () => Math.round(Date.now() / 1000);

beforeEach(() => {
  storedAuthSession = {
    authProvider: 'eInnsyn',
    authTimestamp: 1234,
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
  };
  requestBodies = [];
  updateAuthMock.mock.resetCalls();
  deleteAuthMock.mock.resetCalls();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('attemptTokenRefresh', () => {
  test('stores the new pair and keeps the login timestamp', async () => {
    mockFetchResponse(async () => createTokenResponse(1800));

    await einnsynAuth.attemptTokenRefresh('refresh-1');

    assert.deepEqual(requestBodies, [{ refreshToken: 'refresh-1' }]);
    assert.equal(deleteAuthMock.mock.callCount(), 0);
    const {
      expiresAt: accessTokenExpiresAt,
      ...authSessionWithoutAccessExpiry
    } = storedAuthSession;
    assert.deepEqual(authSessionWithoutAccessExpiry, {
      authProvider: 'eInnsyn',
      authTimestamp: 1234,
      accessToken: 'access-2',
      refreshToken: issuedRefreshToken,
      refreshExpiresAt: refreshTokenExpiresAt,
    });
    assert.ok(
      Math.abs((accessTokenExpiresAt ?? 0) - (currentTimeInSeconds() + 1800)) <=
        1,
    );
  });

  test('a refresh token without a readable expiry leaves it unknown', async () => {
    mockFetchResponse(async () => createTokenResponse(1800, 'opaque'));

    await einnsynAuth.attemptTokenRefresh('refresh-1');

    assert.equal(storedAuthSession.refreshToken, 'opaque');
    assert.equal(storedAuthSession.refreshExpiresAt, undefined);
  });

  test('a rejected refresh token ends the session', async () => {
    mockFetchResponse(async () =>
      Response.json(
        { type: 'authenticationError', message: 'Invalid refresh token' },
        { status: 401 },
      ),
    );

    await einnsynAuth.attemptTokenRefresh('refresh-1');

    assert.equal(deleteAuthMock.mock.callCount(), 1);
    assert.equal(updateAuthMock.mock.callCount(), 0);
  });

  for (const [failureDescription, createResponse] of [
    [
      'an unreachable API',
      async () => Promise.reject(new TypeError('fetch failed')),
    ],
    [
      'a gateway error page',
      async () => new Response('<html>', { status: 502 }),
    ],
    [
      'any other API error',
      async () =>
        Response.json({ type: 'internalServerError' }, { status: 500 }),
    ],
  ] as const) {
    test(`${failureDescription} keeps the session for the next request to retry`, async () => {
      mockFetchResponse(createResponse);

      await einnsynAuth.attemptTokenRefresh('refresh-1');

      assert.equal(deleteAuthMock.mock.callCount(), 0);
      assert.equal(updateAuthMock.mock.callCount(), 0);
    });
  }
});

describe('eInnsynLogin', () => {
  test('stores when both tokens expire', async () => {
    storedAuthSession = {};
    mockFetchResponse(async () => createTokenResponse(3600));
    const loginFormData = new FormData();
    loginFormData.set('username', 'user@example.no');
    loginFormData.set('password', 'secret');

    const { success } = await einnsynAuth.eInnsynLogin({}, loginFormData);
    assert.equal(success, true);

    assert.ok(
      Math.abs(
        (storedAuthSession.expiresAt ?? 0) - (currentTimeInSeconds() + 3600),
      ) <= 1,
    );
    assert.equal(storedAuthSession.refreshExpiresAt, refreshTokenExpiresAt);
  });
});
