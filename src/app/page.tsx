import { cachedApiClient } from '~/actions/api/getApiClient';
import { cachedAuthInfo } from '~/actions/authentication/auth';
import ApiKeyLogin from '~/features/admin/api-keys/ApiKeyLogin';
import ApiKeysUnavailable from '~/features/admin/api-keys/ApiKeysUnavailable';
import { logger } from '~/lib/utils/logger';
import ApiKeys from '../features/admin/api-keys/ApiKeys';

export default async function Root() {
  const authInfo = await cachedAuthInfo();
  if (!authInfo) {
    return <ApiKeyLogin />;
  }
  if (authInfo.enhet?.verified === false) {
    return <ApiKeysUnavailable reason="pendingVerification" />;
  }

  const apiClient = await cachedApiClient();
  const enhetId = authInfo.orgnummer ? authInfo.orgnummer : '';
  const apiKeys = await apiClient.enhet.listApiKey(enhetId).catch((error) => {
    logger.warn('Failed to fetch API keys for enhet', {
      error: error instanceof Error ? error.message : String(error),
      enhetId,
    });
    return null;
  });

  if (!apiKeys) {
    return <ApiKeysUnavailable reason="notRegistered" />;
  }

  return <ApiKeys apiKeys={apiKeys} />;
}
