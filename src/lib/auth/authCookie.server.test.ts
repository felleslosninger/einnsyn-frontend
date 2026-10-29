import assert from 'node:assert';
import { afterEach, before, beforeEach, describe, mock, test } from 'node:test';
import { pathToFileURL } from 'node:url';
import type { Auth } from './auth';

const moduleUrl = (path: string) => pathToFileURL(path).href;

let settings = { stayLoggedIn: false };
let written: { name: string; content: Partial<Auth>; maxAge?: number }[] = [];

// The real cookie store needs a Next.js request scope.
mock.module(moduleUrl('src/lib/cookies/cookies.server.ts'), {
  namedExports: {
    updateCookie: async (
      name: string,
      content: Partial<Auth>,
      cookieSettings: { maxAge?: number },
    ) => {
      written.push({ name, content, maxAge: cookieSettings.maxAge });
      return content;
    },
    getCookie: async () => null,
    deleteCookie: async () => {},
  },
});
mock.module(moduleUrl('src/lib/settings/settings.server.ts'), {
  namedExports: { getSettings: async () => settings },
});

let authCookie: typeof import('./authCookie.server');
before(async () => {
  authCookie = await import('./authCookie.server');
});

const now = 1_800_000_000;
const inTwoHours = now + 7200;

const session = (
  authProvider: Auth['authProvider'],
  more: Partial<Auth> = {},
): Auth => ({
  authProvider,
  authTimestamp: 1234,
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  ...more,
});

beforeEach(() => {
  mock.timers.enable({ apis: ['Date'], now: now * 1000 });
  written = [];
});

afterEach(() => {
  mock.timers.reset();
});

describe('updateAuth', () => {
  for (const [name, stayLoggedIn, auth, maxAge] of [
    [
      'an eInnsyn session without "stay logged in" lasts 30 minutes',
      false,
      session('eInnsyn', { refreshExpiresAt: inTwoHours }),
      60 * 30,
    ],
    [
      'a remembered eInnsyn session lasts as long as its refresh token',
      true,
      session('eInnsyn', { refreshExpiresAt: inTwoHours }),
      7200,
    ],
    [
      'a remembered eInnsyn session with an unknown refresh expiry lasts a year',
      true,
      session('eInnsyn'),
      60 * 60 * 24 * 365,
    ],
    [
      'an Ansattporten session lasts as long as its refresh token',
      false,
      session('ansattporten', { refreshExpiresAt: inTwoHours }),
      7200,
    ],
    [
      'an Ansattporten session with an unknown refresh expiry lasts a year',
      false,
      session('ansattporten'),
      60 * 60 * 24 * 365,
    ],
  ] as const) {
    test(name, async () => {
      settings = { stayLoggedIn };

      await authCookie.updateAuth(auth);

      assert.deepEqual(
        written.map((cookie) => [cookie.name, cookie.maxAge]),
        [
          ['auth-timestamp', maxAge],
          ['auth', maxAge],
        ],
      );
    });
  }

  test('stamps when the auth cookie was written', async () => {
    const auth = session('eInnsyn');

    await authCookie.updateAuth(auth);

    assert.deepEqual(written[1].content, { ...auth, renewedAt: now });
  });
});

describe('maybeRenewAuth', () => {
  for (const [name, renewedAt] of [
    ['over a minute ago', now - 61],
    ['at an unknown time', undefined],
  ] as const) {
    test(`renews a session with an idle timeout written ${name}`, async () => {
      settings = { stayLoggedIn: false };

      await authCookie.maybeRenewAuth(session('eInnsyn', { renewedAt }));

      assert.deepEqual(
        written.map((cookie) => [cookie.name, cookie.maxAge]),
        [
          ['auth-timestamp', 60 * 30],
          ['auth', 60 * 30],
        ],
      );
    });
  }

  test('leaves a session written within the last minute', async () => {
    settings = { stayLoggedIn: false };

    await authCookie.maybeRenewAuth(
      session('eInnsyn', { renewedAt: now - 30 }),
    );

    assert.deepEqual(written, []);
  });

  for (const [name, stayLoggedIn, provider] of [
    ['a remembered eInnsyn session', true, 'eInnsyn'],
    ['an Ansattporten session', false, 'ansattporten'],
  ] as const) {
    test(`leaves ${name}, which only a refresh extends`, async () => {
      settings = { stayLoggedIn };

      await authCookie.maybeRenewAuth(
        session(provider, {
          refreshExpiresAt: inTwoHours,
          renewedAt: now - 61,
        }),
      );

      assert.deepEqual(written, []);
    });
  }
});
