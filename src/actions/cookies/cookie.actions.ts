'use server';

import { cookies } from 'next/headers';

const defaultCookieSettings = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 365,
  sameSite: 'lax' as boolean | 'lax' | 'strict' | 'none' | undefined,
};
export type CookieSettings = typeof defaultCookieSettings;

/**
 *
 * @param cookieName
 * @returns
 */
export async function getCookie<T>(cookieName: string): Promise<T | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(cookieName);

  try {
    const json = cookie?.value ? JSON.parse(cookie.value) : null;
    return json as T;
  } catch (_error) {
    return null;
  }
}

/**
 *
 * @param cookieName
 * @param newContent
 * @param cookieSettings
 * @returns
 */
export async function updateCookieAction<T>(
  cookieName: string,
  newContent: Partial<T>,
  cookieSettings: Partial<CookieSettings> = {},
): Promise<Partial<T>> {
  const cookieStore = await cookies();
  const currentContent = await getCookie<T>(cookieName);

  const content = {
    ...currentContent,
    ...newContent,
  };

  cookieStore.set(cookieName, JSON.stringify(content), {
    ...defaultCookieSettings,
    ...cookieSettings,
  });

  return content;
}

/**
 *
 * @param cookieName
 */
export async function deleteCookieAction(cookieName: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}
