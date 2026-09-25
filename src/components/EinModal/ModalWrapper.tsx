'use client';

import { useSelectedLayoutSegments } from 'next/navigation';
import { useEffect } from 'react';
import {
  useOptimisticPathname,
  useOptimisticSearchParams,
} from '~/components/NavigationProvider/NavigationProvider';
import { setModalBasepath } from '~/hooks/useModalBasepath';
import EinModal from './EinModal';

/**
 * Drives {@link EinModal} from the `@modal` slot: the modal is open exactly
 * while an intercepted route `(.)…` is active in that slot.
 *
 * It also remembers the last non-intercepted URL as the modal's base path,
 * which is what a modal needs to close back to.
 */
export function ModalWrapper({ children }: { children: React.ReactNode }) {
  const pathname = useOptimisticPathname();
  const searchParams = useOptimisticSearchParams();
  const modalSegment = useSelectedLayoutSegments('modal');
  const modalIsOpen = /\(\.+\)/.test(modalSegment.join('/') ?? '');

  // Update path name if we don't have an intercepted path
  useEffect(() => {
    if (!modalIsOpen) {
      setModalBasepath(
        pathname + (searchParams ? `?${searchParams.toString()}` : ''),
      );
    }
  }, [modalIsOpen, pathname, searchParams]);

  return <EinModal open={modalIsOpen}>{children}</EinModal>;
}
