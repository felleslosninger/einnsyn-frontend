import type { Metadata } from 'next';
import { getTranslator } from '~/lib/translation/translation.server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  // Next merges a 404's metadata once per parallel route and applies the
  // template only to the first, so skip it rather than get it on some 404s
  return { title: { absolute: t('site.notFound') } };
}

export default function NotFound() {
  return (
    <div className="container-wrapper">
      <div className="container-pre" />
      <div className="container">
        <h2>404 Not Found</h2>
      </div>
      <div className="container-post" />
    </div>
  );
}
