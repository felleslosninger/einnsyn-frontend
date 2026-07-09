import type { NextRequest } from 'next/server';
import { getAuth } from '~/actions/cookies/authCookie';

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return new Response('Missing id parameter', { status: 400 });
  }

  const format = request.nextUrl.searchParams.get('format');

  const auth = await getAuth();
  const headers: HeadersInit = {};
  if (auth?.accessToken) {
    headers.Authorization = `Bearer ${auth.accessToken}`;
  }

  const upstream = await fetch(
    `${process.env.API_URL}/v2/dokumentobjekt/${encodeURIComponent(id)}/download`,
    { headers },
  );

  if (!upstream.ok) {
    return new Response(upstream.statusText, { status: upstream.status });
  }

  const extension = format?.toLowerCase();
  const fallbackFilename = extension ? `${id}.${extension}` : id;
  const fallbackDisposition = `inline; filename="${fallbackFilename}"`;

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type':
        upstream.headers.get('Content-Type') ?? 'application/octet-stream',
      'Content-Disposition':
        upstream.headers.get('Content-Disposition') ?? fallbackDisposition,
    },
  });
}
