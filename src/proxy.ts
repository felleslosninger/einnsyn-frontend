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

  const response = NextResponse.next({
    request,
  });

  return response;
}

export const config = {
  matcher: [
    // Don't match Next.js internal paths or static assets
    '/((?!_next|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)',
  ],
};
