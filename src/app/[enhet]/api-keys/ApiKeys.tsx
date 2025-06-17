'use client';

import type { ApiKey, PaginatedList } from '@digdir/einnsyn-sdk';
import { useCallback, useState } from 'react';
import { EinButton } from '~/components/EinButton/EinButton';
import { useTranslation } from '~/hooks/useTranslation';
import AddApiKeyModal from './AddApiKeyModal';
import ApiKeyItem from './ApiKeyItem';

import { PlusCircleIcon } from '@navikt/aksel-icons';
import { fetchNextPage } from '~/actions/api/pagination';
import { EinScrollTrigger } from '~/components/EinScrollTrigger/EinScrollTrigger';
import styles from './ApiKeys.module.scss';

export default function ApiKeys({
  apiKeys,
}: { apiKeys: PaginatedList<ApiKey>; enhetId: string }) {
  const t = useTranslation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentApiKeys, setCurrentApiKeys] =
    useState<PaginatedList<ApiKey>>(apiKeys);

  const scrollTriggerHandler = useCallback(async () => {
    const nextPageData = await fetchNextPage(currentApiKeys);
    setCurrentApiKeys(nextPageData);
  }, [currentApiKeys]);

  const addApiKey = useCallback((newKey: ApiKey, position = 0) => {
    setCurrentApiKeys((prev) => ({
      items: [
        ...prev.items.slice(0, position),
        newKey,
        ...prev.items.slice(position),
      ],
    }));
  }, []);

  const removeApiKey = useCallback(
    (removedId: string) => {
      const removedKey = currentApiKeys.items.find(
        (key) => key.id === removedId,
      );
      if (!removedKey) {
        return;
      }

      const newApiKeys = {
        ...currentApiKeys,
        items: currentApiKeys.items.filter((key) => key !== removedKey),
      };
      setCurrentApiKeys(newApiKeys);

      return removedKey;
    },
    [currentApiKeys],
  );

  return (
    <>
      <AddApiKeyModal
        open={showAddModal}
        setOpen={setShowAddModal}
        addApiKeyHandler={addApiKey}
      />

      <div className="container-wrapper">
        <div className="container-pre" />
        <div className="container">
          <div className={styles.header}>
            <h1 className="ds-heading" data-size="lg">
              {t('admin.apiKey.labelPlural')}
            </h1>

            <EinButton onClick={() => setShowAddModal(true)}>
              <PlusCircleIcon title="a11y-title" fontSize="1.5rem" />
              {t('admin.apiKey.addApiKey')}
            </EinButton>
          </div>

          <div className={styles.intro}>{t('admin.apiKey.intro')}</div>

          <div className="ein-table">
            <div className="table-row table-header">
              <div className="table-cell">{t('admin.apiKey.keyName')}</div>
              <div className="table-cell">{t('admin.apiKey.expiresAt')}</div>
              <div className="table-cell">{/*{t('common.delete')}*/}</div>
            </div>
            {/* Display currentApiKeys which will be updated on scroll */}
            {currentApiKeys.items.map((key: ApiKey) => (
              <ApiKeyItem
                key={key.id}
                apiKey={key}
                removeApiKeyHandler={removeApiKey}
              />
            ))}
          </div>

          {/* Conditionally render EinScrollTrigger only if there's a next page */}
          {currentApiKeys.next && (
            <EinScrollTrigger onEnter={scrollTriggerHandler} />
          )}
        </div>
        <div className="container-post" />
      </div>
    </>
  );
}
