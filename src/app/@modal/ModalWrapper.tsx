'use client';

import { useSelectedLayoutSegments } from 'next/navigation';
import { useEffect } from 'react';
import EinModal from '~/components/EinModal/EinModal';
import {
  useOptimisticPathname,
  useOptimisticSearchParams,
} from '~/components/NavigationProvider/NavigationProvider';
import { setModalBasepath } from '~/hooks/useModalBasepath';

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
