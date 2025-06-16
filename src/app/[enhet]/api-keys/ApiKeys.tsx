'use client';

import type { ApiKey, PaginatedList } from '@digdir/einnsyn-sdk';
import { useActionState, useState, useTransition } from 'react';
import { EinButton } from '~/components/EinButton/EinButton';
import { useTranslation } from '~/hooks/useTranslation';
import AddApiKeyModal from './AddApiKeyModal';
import ApiKeyItem from './ApiKeyItem';
import { addApiKeyAction } from './page';

export default function ApiKeys({
  apiKeys,
  enhetId,
}: { apiKeys: PaginatedList<ApiKey>; enhetId: string }) {
  const t = useTranslation();
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <>
      <AddApiKeyModal open={showAddModal} />

      <div className="container-wrapper">
        <div className="container-pre" />
        <div className="container">
          <h1>{t('admin.apiKey.labelPlural')}</h1>

          <EinButton onClick={() => setShowAddModal(true)}>
            {t('admin.apiKey.addApiKey')}
          </EinButton>

          <table>
            <thead>
              <tr>
                <th>{t('admin.apiKey.keyName')}</th>
                <th>{t('admin.apiKey.expiresAt')}</th>
                <th>{t('common.delete')}</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.items.map((key: ApiKey) => (
                <ApiKeyItem key={key.id} apiKey={key} />
              ))}
            </tbody>
          </table>
        </div>
        <div className="container-post" />
      </div>
    </>
  );
}
