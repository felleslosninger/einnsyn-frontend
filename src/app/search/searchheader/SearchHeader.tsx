'use client';

import { Buildings3Icon } from '@navikt/aksel-icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useModalBasepath } from '~/app/@modal/ModalWrapper';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinSearchField } from '~/components/EinSearchField/EinSearchField';
import SearchTabs from './SearchTabs';

export default function SearchHeader() {
  const defaultSearchPath = '/search';
  const router = useRouter();
  const basepath = useModalBasepath();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') ?? '');

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' && event.key !== 'Escape') {
      setSearchQuery(event.currentTarget.value ?? '');
    }
    if (event.key === 'Escape') {
      event.currentTarget.value = '';
      setSearchQuery('');
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
        <EinSearchField
          name="q"
          autoComplete="off"
          onKeyDown={onKeyDown}
          onInput={onKeyDown}
          value={searchQuery}
        >
          <EinButton style="link" data-size="sm">
            <Buildings3Icon title="Enhet" fontSize="1.2rem" />{' '}
            <span className="text">Alle virksomheter</span>
          </EinButton>
        </EinSearchField>

        {/* Include current query parameters as hidden inputs */}
        {Array.from(searchParams?.entries() ?? []).map(
          ([key, value]) =>
            key !== 'q' && (
              <input key={key} type="hidden" name={key} value={value} />
            ),
        )}
      </form>

      <SearchTabs />
    </>
  );
}
