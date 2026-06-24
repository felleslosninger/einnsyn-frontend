import type { NextRequest } from 'next/server';
import { getAuth } from '~/actions/cookies/authCookie';

export async function GET(request: NextRequest) {
  const iri = request.nextUrl.searchParams.get('iri');
  if (!iri) {
    return new Response('Missing iri parameter', { status: 400 });
  }

  const auth = await getAuth();
  const headers: HeadersInit = {};
  if (auth?.accessToken) {
    headers['Authorization'] = `BEARER ${auth.accessToken}`;
  }

  const filBaseUrl =
    process.env.FIL_BASE_URL ?? `${process.env.API_URL}/v2/fil`;

  const upstream = await fetch(
    `${filBaseUrl}?iri=${encodeURIComponent(iri)}`,
    { headers },
  );

  if (!upstream.ok) {
    return new Response(upstream.statusText, { status: upstream.status });
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type':
        upstream.headers.get('Content-Type') ?? 'application/octet-stream',
      'Content-Disposition':
        upstream.headers.get('Content-Disposition') ?? 'inline',
    },
  });
}
