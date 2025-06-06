import type { Moetesak } from '@digdir/einnsyn-sdk';
import SearchResultSubheader from './common/SearchResultSubheader';
import { useTranslation } from '~/hooks/useTranslation';

export default function MoetesakResult({ item }: { item: Moetesak }) {
	const translate = useTranslation();
	return (
		<div className="search-result moetesak-result">
			<h2 className="ds-heading">{item.offentligTittel}</h2>
			<div className="ds-paragraph">
				<SearchResultSubheader
					item={item}
					label={translate('moetesak.label')}
				/>
			</div>
		</div>
	);
}
