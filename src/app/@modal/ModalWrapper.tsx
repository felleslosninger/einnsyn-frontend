'use client';

import {
  usePathname,
  useSearchParams,
  useSelectedLayoutSegments,
} from 'next/navigation';
import { useEffect } from 'react';
import EinModal from '~/components/EinModal/EinModal';

// Keep track of the last pathname before a modal is opened. A modal is never opened on
// the server side, so we fall back to returning '/' in that case.
let basepath = '/';
export function useModalBasepath() {
  return basepath;
}

export function ModalWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams().toString();
  const modalSegment = useSelectedLayoutSegments('modal');
  const modalIsOpen = /\(\.+\)/.test(modalSegment.join('/') ?? '');

  // Update path name if we don't have an intercepted path
  useEffect(() => {
    if (!modalIsOpen) {
      basepath = pathname + (searchParams ? `?${searchParams}` : '');
    }
  }, [modalIsOpen, pathname, searchParams]);

  return <EinModal open={modalIsOpen}>{children}</EinModal>;
}
