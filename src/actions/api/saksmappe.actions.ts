import { cache } from 'react';
import { cachedApiClient } from './getApiClient';

// React-cached per request. Note that `cache()` keys on argument identity *and*
// arity, so adding an options parameter here is a trap: callers passing an inline
// array literal get a fresh reference — and therefore a fresh cache entry and a
// duplicate request — on every call. Keep the expand list fixed here instead.
export const getSaksmappe = cache(async (id: string) => {
  const apiClient = await cachedApiClient();
  return apiClient.saksmappe.get(id, {
    expand: ['administrativEnhetObjekt.parent.parent.parent.parent'],
  });
});
