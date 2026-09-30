import { ApiKeysPage } from '~/features/admin';

export default async function ApiKeys({
  params,
}: {
  params: Promise<{ enhetId: string }>;
}) {
  const { enhetId } = await params;

  return <ApiKeysPage enhetId={enhetId} />;
}
