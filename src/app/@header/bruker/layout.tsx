import { notFound } from 'next/navigation';
import BrukerHeader from '~/features/bruker/BrukerHeader';
import { cachedAuthInfo } from '~/lib/auth/auth.server';

export default async function BrukerHeaderLayout() {
  const authInfo = await cachedAuthInfo();
  if (authInfo?.type !== 'Bruker') {
    notFound();
  }

  return <BrukerHeader />;
}
