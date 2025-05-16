'use client';

import { Search, SearchClear, SearchInput } from '@digdir/designsystemet-react';
import { useEffect, useState } from 'react';
import SearchResultTabs from './SearchResultTabs';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import EinContainer from '~/components/EinContainer/EinContainer';
import Logo from '~/components/Logo';
import { useModalBasepath } from '~/hooks/useModalBasepath';
import { useTranslation } from '~/hooks/useTranslation';
import './searchStyles.scss';

export default function SearchHeader() {
	const translation = useTranslation();
	const router = useRouter();
	const basepath = useModalBasepath();
	const searchParams = useSearchParams();
	const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '');

	const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key !== 'Enter') {
			setSearchQuery(event.currentTarget.value ?? '');
		}
	};

	useEffect(() => {
		setSearchQuery(searchParams.get('q') ?? '');
	}, [searchParams]);

	const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const newParams = new URLSearchParams(searchParams.toString());

		if (searchQuery.trim()) {
			newParams.set('q', searchQuery.trim());
		} else {
			newParams.delete('q');
		}

		router.push(`${basepath}?${newParams.toString()}`);
	};

	return (
		<>
			<EinContainer
				className="search-form"
				pre={
					<a className="logo" href="/">
						<Logo />
					</a>
				}
				post={
					<Link href={`${basepath}/login`}>{translation('site.login')}</Link>
				}
			>
				<form method="get" onSubmit={onSubmit} action={basepath}>
					<Search data-color="brand3">
						<SearchInput
							aria-label="Søk"
							name="q"
							autoComplete="off"
							onKeyDown={onKeyDown}
							onInput={onKeyDown}
							value={searchQuery}
						/>
						<SearchClear />
					</Search>

					{/* Include current query parameters as hidden inputs */}
					{Array.from(searchParams.entries()).map(
						([key, value]) =>
							key !== 'q' && (
								<input key={key} type="hidden" name={key} value={value} />
							),
					)}
				</form>
			</EinContainer>
			<div className="search-result-tabs" data-size="sm">
				<EinContainer collapsible>
					<SearchResultTabs />
				</EinContainer>
			</div>
		</>
	);
}
