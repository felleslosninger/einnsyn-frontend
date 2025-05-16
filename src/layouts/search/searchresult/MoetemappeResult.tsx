import type { Moetemappe } from '@digdir/einnsyn-sdk';
import SearchResultSubheader from './common/SearchResultSubheader';
import { useTranslation } from '~/hooks/useTranslation';

export default function MoetemappeResult({ item }: { item: Moetemappe }) {
	const translate = useTranslation();
	return (
		<div className="search-result moetemappe-result">
			<h2 className="ds-heading">{item.offentligTittel}</h2>
			<div className="ds-paragraph">
				<SearchResultSubheader
					item={item}
					label={translate('moetemappe.label')}
				/>
			</div>
		</div>
	);
}
