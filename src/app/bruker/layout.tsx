import type { Metadata } from 'next';
import { LoginRequired } from '~/features/login';
import { cachedAuthInfo } from '~/lib/auth/auth.server';
import { getTranslator } from '~/lib/translation/translation.server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  const section = t('bruker.title');
  // Already names eInnsyn (mitt eInnsyn), so it skips the template's suffix
  return { title: { absolute: section, template: `%s – ${section}` } };
}

export default async function BrukerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authInfo = await cachedAuthInfo();
  if (authInfo?.type !== 'Bruker') {
    return <LoginRequired />;
  }

  return <>{children}</>;
}
