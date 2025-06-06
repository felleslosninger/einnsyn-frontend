'use client';

import { Search, SearchClear, SearchInput } from '@digdir/designsystemet-react';
import { useEffect, useState } from 'react';
import SearchResultTabs from './SearchResultTabs';

import { useRouter, useSearchParams } from 'next/navigation';
import { useModalBasepath } from '~/app/@modal/ModalWrapper';
import Logo from '~/components/Logo';
import UserMenu from '../_header/UserMenu';

import searchHeaderStyles from './SearchHeader.module.scss';
import './searchStyles.scss';
import SettingsMenu from '../_header/SettingsMenu';

export default function SearchHeader() {
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
      <div className="container-wrapper">
        <div className="container-pre">
          <a className={searchHeaderStyles.logoLink} href="/">
            <Logo />
          </a>
        </div>
        <div className="container search-form">
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
        </div>
        <div className="container-post">
          <SettingsMenu />
          <UserMenu />
        </div>
      </div>

      <div className="search-result-tabs" data-size="sm">
        <div className="container-wrapper">
          <div className="container-pre collapsible" />
          <div className="container">
            <SearchResultTabs />
          </div>
          <div className="container-post" />
        </div>
      </div>
    </>
  );
}
