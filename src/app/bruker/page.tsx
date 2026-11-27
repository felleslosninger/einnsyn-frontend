import { redirect } from 'next/navigation';
import { toLocalizedPath } from '~/lib/routing/pathname';
import { getSettings } from '~/lib/settings/settings.server';

export default async function BrukerPage() {
  const { language } = await getSettings();
  redirect(toLocalizedPath(language, '/bruker/access-requests'));
}
