import { NextResponse } from 'next/server';
import { handleCallback } from '~/lib/auth/ansattporten.server';
import { getOrigin } from '~/lib/utils/getOrigin';

export const GET = async (request: Request) => {
  const returnPath = await handleCallback(request);
  return NextResponse.redirect(new URL(returnPath, await getOrigin()));
};
