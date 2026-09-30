import { cache } from 'react';
import { cachedApiClient } from '~/lib/api/api.server';

export const getSaksmappe = cache(async (id: string) => {
  const apiClient = await cachedApiClient();
  return apiClient.saksmappe.get(id, {
    expand: ['administrativEnhetObjekt.parent.parent.parent.parent'],
  });
});
