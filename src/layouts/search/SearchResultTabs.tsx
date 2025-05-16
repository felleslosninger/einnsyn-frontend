'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTranslation } from '~/hooks/useTranslation';

export default function SearchResultTabs() {
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const t = useTranslation();

	const getLinkUrl = (entityName: string) => {
		const searchParamsCopy = new URLSearchParams(searchParams);
		if (entityName === '') {
			searchParamsCopy.delete('entity');
		} else {
			searchParamsCopy.set('entity', entityName);
		}
		return `${pathname}?${searchParamsCopy.toString()}`;
	};

	const getLinkClassName = (tabName: string) => {
		const classes: string[] = ['search-result-tab'];
		const activeTab = searchParams.get('entity') || '';
		if (activeTab === tabName) {
			classes.push('active');
		}
		return classes.join(' ');
	};

	return (
		<>
			<Link className={getLinkClassName('')} href={getLinkUrl('')}>
				{t('common.all')}
			</Link>
			<Link
				className={getLinkClassName('Saksmappe')}
				href={getLinkUrl('Saksmappe')}
			>
				{t('saksmappe.labelPlural')}
			</Link>
			<Link
				className={getLinkClassName('Journalpost')}
				href={getLinkUrl('Journalpost')}
			>
				{t('journalpost.labelPlural')}
			</Link>
			<Link
				className={getLinkClassName('Moetemappe')}
				href={getLinkUrl('Moetemappe')}
			>
				{t('moetemappe.labelPlural')}
			</Link>
			<Link
				className={getLinkClassName('Moetesak')}
				href={getLinkUrl('Moetesak')}
			>
				{t('moetesak.labelPlural')}
			</Link>
		</>
	);
}
