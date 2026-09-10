import { headers } from 'next/headers';

// The request URL, as exposed by `proxy.ts`. A layout receives neither its
// child segments' params nor `searchParams` at all, so the parts of the URL a
// layout needs have to arrive as headers — see `proxy.ts` for which layouts
// depend on which. Keeping both reads here means that coupling is stated once
// rather than in every route file that needs it.

/** The pathname of the current request. */
export async function getRequestPathname(): Promise<string> {
  return (await headers()).get('x-pathname') ?? '';
}

/** The query string of the current request. */
export async function getRequestSearchParams(): Promise<URLSearchParams> {
  return new URLSearchParams((await headers()).get('x-search') ?? '');
}
