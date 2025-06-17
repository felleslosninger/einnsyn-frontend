'use server';

import type { ApiKey, Base, PaginatedList } from '@digdir/einnsyn-sdk';
import { notFound } from 'next/navigation';
import { getApiClient } from '~/actions/api/getApiClient';
import ApiKeys from './ApiKeys';
import { revalidatePath } from 'next/cache';

type ApiKeyState = {
  addedKey?: ApiKey;
  apiKeys: PaginatedList<ApiKey>;
};

export async function deleteApiKeyAction(formData: FormData) {
  const apiClient = await getApiClient();
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
  const apiClient = await getApiClient();
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

  const apiKey = await apiClient.enhet.addApiKey(enhetId, apiKeyData);

  return apiKey;
}

export default async function ApiKeysPage({
  params,
  searchParams,
}: {
  params: Promise<{ enhet: string }>;
  searchParams: Promise<{ [key: string]: string }>;
}) {
  const { enhet: enhetId = '' } = await params;
  if (!enhetId) {
    notFound();
  }

  const apiClient = await getApiClient();
  const enhet = await apiClient.enhet.get(enhetId).catch((error) => {});
  if (!enhet) {
    notFound();
  }

  try {
    const apiKeys = await apiClient.enhet.listApiKey(enhetId);
    return <ApiKeys apiKeys={apiKeys} enhetId={enhetId} />;
  } catch (error) {
    console.warn('Failed to fetch API keys:', error);
    notFound();
  }
}
