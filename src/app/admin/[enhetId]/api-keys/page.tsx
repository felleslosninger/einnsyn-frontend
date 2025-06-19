'use server';

import type { ApiKey } from '@digdir/einnsyn-sdk';
import { notFound } from 'next/navigation';
import { cachedApiClient } from '~/actions/api/getApiClient';
import { cachedAuthInfo } from '~/actions/authentication/auth';
import ApiKeys from './ApiKeys';

export async function deleteApiKeyAction(formData: FormData) {
  const apiClient = await cachedApiClient();
  const keyId = formData.get('keyId');
  if (typeof keyId !== 'string') {
    throw new Error('API key ID is required');
  }

  await apiClient.apikey.delete(keyId);
}

export async function addApiKeyAction(
  previousState: ApiKey | undefined,
  formData: FormData,
): Promise<ApiKey | undefined> {
  const apiClient = await cachedApiClient();
  const enhetId = formData.get('enhetId');
  if (typeof enhetId !== 'string') {
    throw new Error('Enhet ID is required');
  }

  const name = formData.get('name');
  if (typeof name !== 'string') {
    throw new Error('API key name is required');
  }

  const expiresInDays = formData.get('expiresInDays');
  const apiKeyData: { name: string; expiresAt?: string } = { name };
  if (typeof expiresInDays === 'string' && expiresInDays.trim() !== '') {
    const expiresAt =
      Date.now() + Number.parseInt(expiresInDays, 10) * 24 * 60 * 60 * 1000;
    apiKeyData.expiresAt = new Date(expiresAt).toISOString();
  }

  try {
    const apiKey = await apiClient.enhet.addApiKey(enhetId, apiKeyData);
    return apiKey;
  } catch (error) {
    throw new Error('Failed to create API key');
  }
}

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
