'use client';

import EinModal from '~/components/EinModal/EinModal';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';

export function ModalWrapper({ children }: { children: React.ReactNode }) {
  const { modalOpen } = useNavigation();
  return <EinModal open={modalOpen}>{children}</EinModal>;
}
