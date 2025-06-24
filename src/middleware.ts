import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { maybeRefreshToken } from './actions/authentication/auth';

export async function middleware(request: NextRequest) {
  // This will update the auth cookie if needed
  await maybeRefreshToken();

  // Copy potentially updated cookies to the passed on request
  const updatedCookies = await cookies();
  console.log('Maybe update cookies');
  for (const currentCookie of updatedCookies.getAll()) {
    const requestCookie = request.cookies.get(currentCookie.name);
    if (requestCookie?.value !== currentCookie.value) {
      console.log('Updating cookie:', currentCookie.name);
      request.cookies.set(currentCookie.name, currentCookie.value);
    }
  }

  // Remove deleted cookies from the request
  for (const requestCookie of request.cookies.getAll()) {
    if (!updatedCookies.get(requestCookie.name)) {
      console.log('Deleting cookie:', requestCookie.name);
      request.cookies.delete(requestCookie.name);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Don't match Next.js internal paths or static assets
    '/((?!_next|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)',
  ],
};
