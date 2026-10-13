import { NextResponse } from 'next/server';
import { handleCallback } from '~/lib/auth/ansattporten.server';

export const GET = async (request: Request) => {
  const url = (await handleCallback(request)) ?? '/';
  return NextResponse.redirect(new URL(url));
};
