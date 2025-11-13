import { notFound } from 'next/navigation';
import { cachedApiClient } from '~/actions/api/getApiClient';
import { cachedAuthInfo } from '~/actions/authentication/auth';
import { logger } from '~/lib/utils/logger';
import ApiKeys from '../../../../features/admin/api-keys/ApiKeys';

export default async function ApiKeysPage({
  params,
}: {
  params: Promise<{ enhetId: string }>;
}) {
  const authInfo = await cachedAuthInfo();
  if (!authInfo) {
    notFound();
  }

  const { enhetId } = await params;
  const apiClient = await cachedApiClient();

  const apiKeys = await apiClient.enhet.listApiKey(enhetId).catch((error) => {
    logger.warn('Failed to fetch API keys for enhet', {
      error: error instanceof Error ? error.message : String(error),
      enhetId,
    });
    notFound();
  });
  return <ApiKeys apiKeys={apiKeys} />;
}
