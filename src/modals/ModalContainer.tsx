'use client';

import { useParams } from 'next/navigation';
import EinModal from '~/components/EinModal/EinModal';
import EinTransition from '~/components/EinTransition/EinTransition';

import { getModalRoute } from '~/lib/utils/routeUtils';

/**
 * Render function that calls child templates
 * @returns
 */
export default function ModalContainer() {
	const params = useParams<{ modal: string[] }>();
	const path = params.modal ?? [];
	const [Template, remainingPath] = getModalRoute(path);

	return (
		<EinModal open={!!Template}>
			<EinModal.Header>
				{Template?.Title && (
					<h1>
						<Template.Title path={remainingPath} />
					</h1>
				)}
			</EinModal.Header>
			<EinModal.Body>
				<EinTransition dependencies={[Template]}>
					<div>
						{Template?.Render && <Template.Render path={remainingPath} />}
					</div>
				</EinTransition>
			</EinModal.Body>
		</EinModal>
	);
}
