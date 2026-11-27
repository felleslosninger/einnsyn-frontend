import type { Metadata } from 'next';
import { getTranslator } from '~/lib/translation/translation.server';

export { AboutPage as default } from '~/features/staticpages';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  // Already names eInnsyn, so it skips the template's suffix
  return { title: { absolute: t('footer.about') } };
}
