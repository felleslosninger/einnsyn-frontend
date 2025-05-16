import type { Saksmappe } from '@digdir/einnsyn-sdk';
import { useTranslation } from '~/hooks/useTranslation';
import EnhetLink from './common/EnhetLink';
import SearchResultSubheader from './common/SearchResultSubheader';

export default function SaksmappeResult({ item }: { item: Saksmappe }) {
	const translate = useTranslation();
	return (
		<div className="search-result saksmappe-result">
			<h2 className="ds-heading">{item.offentligTittel}</h2>
			<div className="ds-paragraph" data-size="sm">
				<div className="saksmappe-enhet">
					<EnhetLink
						withAncestors={false}
						enhet={item.administrativEnhetObjekt}
					/>
				</div>
				<SearchResultSubheader
					item={item}
					label={translate('saksmappe.label')}
				/>
			</div>
		</div>
	);
}
