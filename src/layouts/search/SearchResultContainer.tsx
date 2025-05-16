'use client';

import SearchResult from './searchresult/SearchResult';

import type { Base, PaginatedList } from '@digdir/einnsyn-sdk';
import './searchStyles.scss';
import { useTranslation } from '~/hooks/useTranslation';
import EinContainer from '~/components/EinContainer/EinContainer';

export default function SearchResultContainer({
	searchResults,
}: { searchResults: PaginatedList<Base> }) {
	const t = useTranslation();

	return (
		<EinContainer className="search-container" collapsible>
			<div className="search-results">
				{searchResults.items.length ? (
					searchResults.items.map((item) => (
						<SearchResult key={item.id} item={item} />
					))
				) : (
					<div className="no-results">
						<p>{t('common.noResults')}</p>
					</div>
				)}
			</div>
		</EinContainer>
	);
}
