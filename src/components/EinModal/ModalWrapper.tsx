'use client';

import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import EinModal from './EinModal';

/**
 * Drives {@link EinModal} from the `@modal` slot: the modal is open while the
 * slot renders a page from its `(modal)` route group.
 */
export function ModalWrapper({ children }: { children: React.ReactNode }) {
  const { modalOpen } = useNavigation();
  return <EinModal open={modalOpen}>{children}</EinModal>;
}
