import assert from 'node:assert';
import { afterEach, before, beforeEach, describe, mock, test } from 'node:test';
import { pathToFileURL } from 'node:url';
import type { Auth } from './auth';

const toModuleUrl = (modulePath: string) => pathToFileURL(modulePath).href;

let userSettings = { stayLoggedIn: false };
let writtenCookies: {
  cookieName: string;
  cookieContent: Partial<Auth>;
  maxAge?: number;
}[] = [];

// The real cookie store needs a Next.js request scope.
mock.module(toModuleUrl('src/lib/cookies/cookies.server.ts'), {
  namedExports: {
    updateCookie: async (
      cookieName: string,
      cookieContent: Partial<Auth>,
      cookieSettings: { maxAge?: number },
    ) => {
      writtenCookies.push({
        cookieName,
        cookieContent,
        maxAge: cookieSettings.maxAge,
      });
      return cookieContent;
    },
    getCookie: async () => null,
    deleteCookie: async () => {},
  },
});
mock.module(toModuleUrl('src/lib/settings/settings.server.ts'), {
  namedExports: { getSettings: async () => userSettings },
});

let authCookieModule: typeof import('./authCookie.server');
before(async () => {
  authCookieModule = await import('./authCookie.server');
});

const currentTimeInSeconds = 1_800_000_000;
const refreshTokenExpiresAt = currentTimeInSeconds + 7200;

const createAuthSession = (
  authProvider: Auth['authProvider'],
  overrides: Partial<Auth> = {},
): Auth => ({
  authProvider,
  authTimestamp: 1234,
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  ...overrides,
});

beforeEach(() => {
  mock.timers.enable({ apis: ['Date'], now: currentTimeInSeconds * 1000 });
  writtenCookies = [];
});

afterEach(() => {
  mock.timers.reset();
});

describe('updateAuth', () => {
  for (const [
    testDescription,
    stayLoggedIn,
    authSession,
    expectedMaxAgeSeconds,
  ] of [
    [
      'an eInnsyn session without "stay logged in" lasts 30 minutes',
      false,
      createAuthSession('eInnsyn', { refreshExpiresAt: refreshTokenExpiresAt }),
      60 * 30,
    ],
    [
      'a remembered eInnsyn session lasts as long as its refresh token',
      true,
      createAuthSession('eInnsyn', { refreshExpiresAt: refreshTokenExpiresAt }),
      7200,
    ],
    [
      'a remembered eInnsyn session with an unknown refresh expiry lasts a year',
      true,
      createAuthSession('eInnsyn'),
      60 * 60 * 24 * 365,
    ],
    [
      'an Ansattporten session lasts as long as its refresh token',
      false,
      createAuthSession('ansattporten', {
        refreshExpiresAt: refreshTokenExpiresAt,
      }),
      7200,
    ],
    [
      'an Ansattporten session with an unknown refresh expiry lasts a year',
      false,
      createAuthSession('ansattporten'),
      60 * 60 * 24 * 365,
    ],
  ] as const) {
    test(testDescription, async () => {
      userSettings = { stayLoggedIn };

      await authCookieModule.updateAuth(authSession);

      assert.deepEqual(
        writtenCookies.map((cookie) => [cookie.cookieName, cookie.maxAge]),
        [
          ['auth-timestamp', expectedMaxAgeSeconds],
          ['auth', expectedMaxAgeSeconds],
        ],
      );
    });
  }

  test('stamps when the auth cookie was written', async () => {
    const authSession = createAuthSession('eInnsyn');

    await authCookieModule.updateAuth(authSession);

    assert.deepEqual(writtenCookies[1].cookieContent, {
      ...authSession,
      renewedAt: currentTimeInSeconds,
    });
  });
});

describe('maybeRenewAuthCookie', () => {
  for (const [renewalTimeDescription, renewedAt] of [
    ['over a minute ago', currentTimeInSeconds - 61],
    ['at an unknown time', undefined],
  ] as const) {
    test(`renews a session with an idle timeout written ${renewalTimeDescription}`, async () => {
      userSettings = { stayLoggedIn: false };

      await authCookieModule.maybeRenewAuthCookie(
        createAuthSession('eInnsyn', { renewedAt }),
      );

      assert.deepEqual(
        writtenCookies.map((cookie) => [cookie.cookieName, cookie.maxAge]),
        [
          ['auth-timestamp', 60 * 30],
          ['auth', 60 * 30],
        ],
      );
    });
  }

  test('leaves a session written within the last minute', async () => {
    userSettings = { stayLoggedIn: false };

    await authCookieModule.maybeRenewAuthCookie(
      createAuthSession('eInnsyn', { renewedAt: currentTimeInSeconds - 30 }),
    );

    assert.deepEqual(writtenCookies, []);
  });

  for (const [sessionDescription, stayLoggedIn, authProvider] of [
    ['a remembered eInnsyn session', true, 'eInnsyn'],
    ['an Ansattporten session', false, 'ansattporten'],
  ] as const) {
    test(`leaves ${sessionDescription}, which only a refresh extends`, async () => {
      userSettings = { stayLoggedIn };

      await authCookieModule.maybeRenewAuthCookie(
        createAuthSession(authProvider, {
          refreshExpiresAt: refreshTokenExpiresAt,
          renewedAt: currentTimeInSeconds - 61,
        }),
      );

      assert.deepEqual(writtenCookies, []);
    });
  }
});
