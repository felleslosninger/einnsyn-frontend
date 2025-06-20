import { notFound } from 'next/navigation';
import { cachedApiClient } from '~/actions/api/getApiClient';
import { cachedAuthInfo } from '~/actions/authentication/auth';
import ApiKeys from './ApiKeys';

export default async function ApiKeysPage({
  params,
}: { params: Promise<{ enhetId: string }> }) {
  const authInfo = await cachedAuthInfo();
  if (!authInfo) {
    notFound();
  }

  const { enhetId } = await params;
  const apiClient = await cachedApiClient();

  const apiKeys = await apiClient.enhet.listApiKey(enhetId).catch((error) => {
    console.warn('Failed to fetch API keys for enhet:', error);
    notFound();
  });
  return <ApiKeys apiKeys={apiKeys} />;
}
