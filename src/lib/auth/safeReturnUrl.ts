/** Return a same-origin URL, or the app homepage for an invalid destination. */
export function getSafeReturnUrl(returnUrl: string, appOrigin: string): string {
  const appUrl = new URL(appOrigin);

  try {
    const destination = new URL(returnUrl, appUrl);
    if (destination.origin !== appUrl.origin) {
      return new URL('/', appUrl).href;
    }

    const safeUrl = new URL(
      `${destination.pathname}${destination.search}${destination.hash}`,
      appUrl,
    );
    return safeUrl.origin === appUrl.origin
      ? safeUrl.href
      : new URL('/', appUrl).href;
  } catch {
    return new URL('/', appUrl).href;
  }
}
