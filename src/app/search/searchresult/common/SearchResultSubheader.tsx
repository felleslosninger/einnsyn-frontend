import type {
	Journalpost,
	Moetemappe,
	Moetesak,
	Saksmappe,
} from '@digdir/einnsyn-sdk';
import { useTranslation } from '~/hooks/useTranslation';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { dateFormat } from '~/lib/utils/dateFormat';
import { capitalize } from '~/lib/utils/stringutils';

export default function SearchResultSubheader({
	label,
	item,
}: {
	label: string;
	item: Journalpost | Saksmappe | Moetesak | Moetemappe | string | undefined;
}) {
	const translate = useTranslation();
	const languageCode = useLanguageCode();

	if (item === undefined || typeof item === 'string') {
		return null;
	}

	const publishedDate = item.publisertDato
		? dateFormat(item.publisertDato, languageCode)
		: undefined;

	const updatedDate = item.oppdatertDato
		? dateFormat(item.oppdatertDato, languageCode)
		: undefined;

	return (
		<div className="search-result-subheader">
			<span className="search-result-type">{capitalize(label)}</span>
			{publishedDate && (
				<>
					<span className="spacer"> &ndash; </span>
					<span className="search-result-published-date">
						{capitalize(translate('common.publishedAt'))}&nbsp;
						{publishedDate}
					</span>
				</>
			)}
			{updatedDate && updatedDate !== publishedDate && (
				<>
					<span className="spacer"> &ndash; </span>
					<span className="search-result-updated-date">
						{capitalize(translate('common.updatedAt'))}&nbsp;
						{updatedDate}
					</span>
				</>
			)}
		</div>
	);
}
