import { useParams, usePathname } from 'next/navigation';
import { useMemo } from 'react';
import type { ModalParams } from '~/lib/utils/routeUtils';

/**
 * Global modals are opened by adding a trailing path name to any route implementing the
 * catch all component. This hook is used to return the base path of the URL, which is the
 * url without the part that is sent to the modal.
 *
 * @returns basePath
 */
export const useModalBasepath = () => {
	const params = useParams<ModalParams>();
	const pathname = usePathname();

	return useMemo(() => {
		const modalPath = (params.modal ?? []).join('/');
		const basePath = pathname.replace(new RegExp(`/${modalPath}$`), '');
		return basePath === '/' ? '' : `${basePath}`;
	}, [params, pathname]);
};
