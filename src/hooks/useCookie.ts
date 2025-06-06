'use client';

import { useEffect, useMemo, useState } from 'react';

// Pick a single cookie from the document.cookie string
const pickCookie = (cookies: string, cookieName: string) => {
  return cookies
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${cookieName}=`));
};

/**
 * Get a parsed JSON cookie from the browser's document.cookie.
 *
 * @param cookieName
 * @returns
 */
export function useCookie<T>(cookieName: string): T | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const cookies = document.cookie;
  const [cookieString, setCookieString] = useState<string | undefined>(
    pickCookie(cookies, cookieName),
  );

  // Poll for cookie changes
  useEffect(() => {
    let timeout: number;
    const updateCookie = () => {
      setCookieString(pickCookie(document.cookie, cookieName));
      // Wrap this in a requestAnimationFrame to make it pause when the tab is
      // inactive
      timeout = window.setTimeout(
        () => requestAnimationFrame(updateCookie),
        5000,
      );
    };
    updateCookie();

    return () => {
      clearTimeout(timeout);
    };
  }, [cookieName]);

  // Memoize parsing
  return useMemo(() => {
    if (!cookieString) {
      return null;
    }

    const cookieValue = cookieString.split('=')[1];
    try {
      const json = cookieValue
        ? JSON.parse(decodeURIComponent(cookieValue))
        : null;
      return json as T;
    } catch (error) {
      console.error('Error parsing cookie:', error);
      return null;
    }
  }, [cookieString]);
}
