'use client';

import { useEffect, useMemo, useState } from 'react';
import { logger } from '~/lib/utils/logger';

const isBrowser = typeof window !== 'undefined';

// Pick a single cookie from the document.cookie string
const pickCookie = (cookies: string, cookieName: string) => {
  return cookies
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${cookieName}=`));
};

/**
 * Get a parsed JSON cookie from the browser's document.cookie.
 * Polls for changes to the cookie value.
 *
 * @param cookieName The name of the cookie to read.
 * @param pollIntervalMs The interval in milliseconds to poll for cookie changes. Set to 0 to disable polling. Defaults to 5000.
 * @returns The parsed cookie value, or null if not found or invalid.
 */
export function useCookie<T>(
  cookieName: string,
  pollIntervalMs = 5000,
): T | null {
  const [cookieString, setCookieString] = useState<string | undefined>(() =>
    isBrowser ? pickCookie(document.cookie, cookieName) : undefined,
  );

  // Poll for cookie changes
  useEffect(() => {
    if (!isBrowser || pollIntervalMs <= 0) {
      return;
    }

    let timeout: number | undefined;
    let animationFrame: number | undefined;
    const updateCookie = () => {
      setCookieString(pickCookie(document.cookie, cookieName));
      animationFrame = undefined;
      // Wrap this in a requestAnimationFrame to make it pause when the tab is
      // inactive
      timeout = window.setTimeout(() => {
        animationFrame = requestAnimationFrame(updateCookie);
      }, pollIntervalMs);
    };
    updateCookie();

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [cookieName, pollIntervalMs]);

  // Memoize parsing
  return useMemo(() => {
    if (!isBrowser || !cookieString) {
      return null;
    }

    try {
      const cookieValue = cookieString.substring(cookieString.indexOf('=') + 1);
      const json = cookieValue
        ? JSON.parse(decodeURIComponent(cookieValue))
        : null;
      return json as T;
    } catch (error) {
      logger.error(`Error parsing cookie "${cookieName}":`, error);
      return null;
    }
  }, [cookieString, cookieName]);
}
