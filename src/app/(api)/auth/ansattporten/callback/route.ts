import { NextResponse } from 'next/server';
import { handleCallback } from '~/actions/authentication/auth.ansattporten';

export const GET = async (request: Request) => {
  const url = (await handleCallback(request)) ?? '/';
  return NextResponse.redirect(new URL(url));
};
