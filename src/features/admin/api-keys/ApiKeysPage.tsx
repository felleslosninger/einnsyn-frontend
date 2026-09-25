import { notFound } from 'next/navigation';
import { cachedApiClient } from '~/actions/api/getApiClient';
import { cachedAuthInfo } from '~/actions/authentication/auth';
import ApiKeys from '~/features/admin/api-keys/ApiKeys';
import { logger } from '~/lib/utils/logger';

/**
 * An enhet's API keys. 404s without a session, and also when the keys cannot be
 * read — an enhet the session may not administer is indistinguishable from one
 * that does not exist.
 */
export default async function ApiKeysPage({ enhetId }: { enhetId: string }) {
  const authInfo = await cachedAuthInfo();
  if (!authInfo) {
    notFound();
  }

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
