import { notFound } from 'next/navigation';
import { cachedAuthInfo } from '~/actions/authentication/auth';
import BrukerHeader from '~/features/bruker/BrukerHeader';

export default async function BrukerHeaderLayout() {
  const authInfo = await cachedAuthInfo();
  if (!authInfo || authInfo.type !== 'Bruker') {
    notFound();
  }

  return <BrukerHeader />;
}
