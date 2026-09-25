import { notFound, redirect } from 'next/navigation';
import { cachedApiClient } from '~/actions/api/getApiClient';
import { cachedAuthInfo } from '~/actions/authentication/auth';
import ApiKeysUnavailable from '~/features/admin/api-keys/ApiKeysUnavailable';
import { logger } from '~/lib/utils/logger';
import ApiKeys from '../../../../features/admin/api-keys/ApiKeys';

export default async function ApiKeysPage({
  params,
}: {
  params: Promise<{ enhetId: string }>;
}) {
  const authInfo = await cachedAuthInfo();
  if (!authInfo) {
    redirect('/login');
  }
  if (authInfo.enhet?.verified === false) {
    return <ApiKeysUnavailable reason="pendingVerification" />;
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
