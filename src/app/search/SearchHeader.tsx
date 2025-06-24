'use client';

import { Search, SearchClear, SearchInput } from '@digdir/designsystemet-react';
import { useEffect, useState } from 'react';
import SearchResultTabs from './SearchResultTabs';

import { useRouter, useSearchParams } from 'next/navigation';
import { useModalBasepath } from '~/app/@modal/ModalWrapper';

import styles from './SearchHeader.module.scss';

export default function SearchHeader() {
  const defaultSearchPath = '/search';
  const router = useRouter();
  const basepath = useModalBasepath();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') ?? '');

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      setSearchQuery(event.currentTarget.value ?? '');
    }
  };

  useEffect(() => {
    setSearchQuery(searchParams?.get('q') ?? '');
  }, [searchParams]);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const newParams = new URLSearchParams(searchParams?.toString());

    if (searchQuery.trim()) {
      newParams.set('q', searchQuery.trim());
    } else {
      newParams.delete('q');
    }

    if (basepath === '/') {
      // Go to the default search path
      router.push(`${defaultSearchPath}?${newParams.toString()}`);
    } else {
      // Make sure we do not add repeated parameters
      const newPath = basepath.split('?', 1)[0];
      router.push(`${newPath}?${newParams.toString()}`);
    }
  };

  return (
    <>
      <form
        className="search-form"
        method="get"
        onSubmit={onSubmit}
        action={basepath}
      >
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
        {Array.from(searchParams?.entries() ?? []).map(
          ([key, value]) =>
            key !== 'q' && (
              <input key={key} type="hidden" name={key} value={value} />
            ),
        )}
      </form>

      <SearchResultTabs />
    </>
  );
}
