import 'server-only';

import type { Metadata } from 'next';
import { getTranslator } from '~/lib/translation/translation.server';

/** A `generateMetadata` that titles the page with a translation. */
export const translatedTitleMetadata =
  (key: string) => async (): Promise<Metadata> => {
    const t = await getTranslator();
    return { title: t(key) };
  };
