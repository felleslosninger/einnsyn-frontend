import assert from 'node:assert';
import { afterEach, before, beforeEach, describe, mock, test } from 'node:test';
import { pathToFileURL } from 'node:url';
import type { Auth } from './auth';

const moduleUrl = (path: string) => pathToFileURL(path).href;

let storedAuth: Partial<Auth> = {};
const updateAuth = mock.fn(async (auth: Auth) => {
  storedAuth = auth;
});
const deleteAuth = mock.fn(async () => {
  storedAuth = {};
});

// The real cookie helpers need a Next.js request scope.
mock.module(moduleUrl('src/lib/auth/authCookie.server.ts'), {
  namedExports: { getAuth: async () => storedAuth, updateAuth, deleteAuth },
});
mock.module(moduleUrl('src/lib/settings/settings.server.ts'), {
  namedExports: {
    getSettings: async () => ({}),
    updateSettings: async () => {},
  },
});
mock.module(moduleUrl('src/lib/utils/logger.ts'), {
  namedExports: {
    logger: { debug: () => {}, error: () => {}, warn: () => {} },
  },
});

let einnsyn: typeof import('./einnsyn.server');
before(async () => {
  einnsyn = await import('./einnsyn.server');
});

const realFetch = globalThis.fetch;
let requests: unknown[] = [];

function respondWith(response: () => Promise<Response>) {
  globalThis.fetch = async (_url, init) => {
    requests.push(JSON.parse(String(init?.body)));
    return response();
  };
}

const tokens = (expiresIn = 3600) =>
  Response.json({ token: 'access-2', refreshToken: 'refresh-2', expiresIn });

const nowInSeconds = () => Math.round(Date.now() / 1000);

beforeEach(() => {
  storedAuth = {
    authProvider: 'eInnsyn',
    authTimestamp: 1234,
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
  };
  requests = [];
  updateAuth.mock.resetCalls();
  deleteAuth.mock.resetCalls();
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

describe('attemptTokenRefresh', () => {
  test('stores the new pair and keeps the login timestamp', async () => {
    respondWith(async () => tokens(1800));

    await einnsyn.attemptTokenRefresh('refresh-1');

    assert.deepEqual(requests, [{ refreshToken: 'refresh-1' }]);
    assert.equal(deleteAuth.mock.callCount(), 0);
    const { expiresAt, ...rest } = storedAuth;
    assert.deepEqual(rest, {
      authProvider: 'eInnsyn',
      authTimestamp: 1234,
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
    });
    assert.ok(Math.abs((expiresAt ?? 0) - (nowInSeconds() + 1800)) <= 1);
  });

  test('a rejected refresh token ends the session', async () => {
    respondWith(async () =>
      Response.json(
        { type: 'authenticationError', message: 'Invalid refresh token' },
        { status: 401 },
      ),
    );

    await einnsyn.attemptTokenRefresh('refresh-1');

    assert.equal(deleteAuth.mock.callCount(), 1);
    assert.equal(updateAuth.mock.callCount(), 0);
  });

  for (const [name, response] of [
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
    test(`${name} keeps the session for the next request to retry`, async () => {
      respondWith(response);

      await einnsyn.attemptTokenRefresh('refresh-1');

      assert.equal(deleteAuth.mock.callCount(), 0);
      assert.equal(updateAuth.mock.callCount(), 0);
    });
  }
});

describe('eInnsynLogin', () => {
  test('stores when the access token expires', async () => {
    storedAuth = {};
    respondWith(async () => tokens(3600));
    const formData = new FormData();
    formData.set('username', 'user@example.no');
    formData.set('password', 'secret');

    const { success } = await einnsyn.eInnsynLogin({}, formData);
    assert.equal(success, true);

    assert.ok(
      Math.abs((storedAuth.expiresAt ?? 0) - (nowInSeconds() + 3600)) <= 1,
    );
  });
});
