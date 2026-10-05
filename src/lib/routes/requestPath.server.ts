import 'server-only';

import { headers } from 'next/headers';

/** The pathname of the current request. */
export async function getRequestPathname(): Promise<string> {
  return (await headers()).get('x-pathname') ?? '';
}

/** The query string of the current request. */
export async function getRequestSearchParams(): Promise<URLSearchParams> {
  return new URLSearchParams((await headers()).get('x-search') ?? '');
}
