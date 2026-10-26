import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cachedAuthInfo } from '~/lib/auth/auth.server';
import { getTranslator } from '~/lib/translation/translation.server';

export async function generateMetadata(): Promise<Metadata> {
  // Next applies this to the layout's own notFound() too
  const authInfo = await cachedAuthInfo();
  if (authInfo?.type !== 'Bruker') {
    return {};
  }

  const t = await getTranslator();
  const section = t('bruker.title');
  return { title: { default: section, template: `%s – ${section}` } };
}

export default async function BrukerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authInfo = await cachedAuthInfo();
  if (authInfo?.type !== 'Bruker') {
    notFound();
  }

  return <>{children}</>;
}
