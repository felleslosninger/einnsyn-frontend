'use server';

import type { ApiKey, Enhet, EnhetRequest } from '@digdir/einnsyn-sdk';
import { cachedApiClient } from '~/actions/api/getApiClient';

export async function deleteApiKeyAction(formData: FormData) {
  const apiClient = await cachedApiClient();
  const keyId = formData.get('keyId');
  if (typeof keyId !== 'string') {
    throw new Error('API key ID is required');
  }

  await apiClient.apikey.delete(keyId);
}

export async function addApiKeyAction(
  _previousState: ApiKey | undefined,
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
  } catch (_error) {
    throw new Error('Failed to create API key');
  }
}

const ENHETSTYPE_VALUES = [
  'ADMINISTRATIVENHET',
  'AVDELING',
  'BYDEL',
  'DUMMYENHET',
  'FYLKE',
  'KOMMUNE',
  'ORGAN',
  'SEKSJON',
  'UTVALG',
  'VIRKSOMHET',
] as const;

type Enhetstype = (typeof ENHETSTYPE_VALUES)[number];

function isEnhetstype(value: string): value is Enhetstype {
  return ENHETSTYPE_VALUES.includes(value as Enhetstype);
}

export async function addOrganizationAction(
  _previousState:
    | { success: boolean; enhet?: Enhet; error?: string }
    | undefined,
  formData: FormData,
): Promise<{ success: boolean; enhet?: Enhet; error?: string }> {
  const apiClient = await cachedApiClient();

  const str = (key: string): string | undefined => {
    const val = formData.get(key);
    return typeof val === 'string' && val.trim() !== '' ? val : undefined;
  };

  const reqStr = (key: string): string => str(key) ?? '';

  const enhetstype = reqStr('enhetstype');
  if (!isEnhetstype(enhetstype)) {
    throw new Error(`Invalid enhetstype: ${enhetstype}`);
  }

  const organizationData: EnhetRequest = {
    navn: reqStr('navn'),
    navnNynorsk: str('navnNynorsk') ?? reqStr('navn'),
    navnEngelsk: str('navnEngelsk') ?? reqStr('navn'),
    navnSami: str('navnSami') ?? reqStr('navn'),
    orgnummer: reqStr('orgnummer'),
    kontaktpunktAdresse: str('kontaktpunktAdresse'),
    kontaktpunktEpost: reqStr('kontaktpunktEpost'),
    kontaktpunktTelefon: str('kontaktpunktTelefon'),
    innsynskravEpost: reqStr('innsynskravEpost'),
    enhetstype,
    avsluttetDato: str('avsluttetDato'),
    handteresAv: str('handteresAv'),
    orderXmlVersjon: str('versjonAvOrderXml')
      ? Number(str('versjonAvOrderXml'))
      : undefined,
    parent: reqStr('parent'),
  };

  try {
    const enhet = await apiClient.enhet.add(organizationData);
    return { success: true, enhet };
  } catch (error) {
    console.error('Failed to create organization:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
