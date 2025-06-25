import { use } from 'react';
import { getOrigin } from '~/lib/utils/getOrigin';

const isBrowser = typeof window !== 'undefined';

export default function useOrigin() {
  if (isBrowser) {
    return window.location.origin;
  }

  return use(getOrigin());
}
