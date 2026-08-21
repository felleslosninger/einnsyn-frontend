import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { maybeRefreshToken } from './actions/authentication/auth';

export async function proxy(request: NextRequest) {
  // This will update the auth cookie if needed
  await maybeRefreshToken();

  // Copy potentially updated cookies to the passed on request
  const updatedCookies = await cookies();
  for (const currentCookie of updatedCookies.getAll()) {
    const requestCookie = request.cookies.get(currentCookie.name);
    if (requestCookie?.value !== currentCookie.value) {
      request.cookies.set(currentCookie.name, currentCookie.value);
    }
  }

  // Remove deleted cookies from the request
  for (const requestCookie of request.cookies.getAll()) {
    if (!updatedCookies.get(requestCookie.name)) {
      request.cookies.delete(requestCookie.name);
    }
  }

  // Expose the request pathname to server components. A layout can't read its
  // child segments' params (e.g. the active `journalpost`), so
  // `case/[saksmappe]/layout.tsx` reads this header to center the journalpost
  // window on a deep link. Built from `request.headers` so the cookie updates
  // applied above are carried along.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  return response;
}

export const config = {
  matcher: [
    // Don't match Next.js internal paths or static assets
    '/((?!_next|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)',
  ],
};
