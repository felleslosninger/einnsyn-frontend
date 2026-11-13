'use client';

import { Skeleton } from '@digdir/designsystemet-react';
import type { LagretSoek, PaginatedList } from '@digdir/einnsyn-sdk';
import { EinLink } from '~/components/EinLink/EinLink';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import { toLocalizedPath } from '~/lib/routing/pathname';
import cn from '~/lib/utils/className';
import { skeletonLength } from '~/lib/utils/skeletonUtils';
import InfiniteList from '../InfiniteList';
import styles from '../List.module.scss';
import ListItem from '../ListItem';
import ListSkeleton from '../ListSkeleton';
import { savedSearchHref } from './savedSearchHref';

export function LagretSoekListSkeleton() {
  return (
    <ListSkeleton
      renderItem={(index) => (
        <h2 className={cn('ds-heading', styles.title)}>
          <Skeleton variant="text" width={skeletonLength(index, 3, 30)} />
        </h2>
      )}
    />
  );
}

export default function LagretSoekList({
  initialPage,
}: {
  initialPage: PaginatedList<LagretSoek>;
}) {
  const t = useTranslation();
  const languageCode = useLanguageCode();

  return (
    <InfiniteList
      initialPage={initialPage}
      skeleton={<LagretSoekListSkeleton />}
      emptyText={t('bruker.savedSearchesPage.empty')}
      renderItem={(item, onDelete) => (
        <ListItem
          entity="LagretSoek"
          id={item.id}
          title={item.label}
          subscribed={item.subscribe === true}
          onDelete={onDelete}
        >
          <h2 className={cn('ds-heading', styles.title)}>
            <EinLink
              href={savedSearchHref(
                toLocalizedPath(languageCode, '/search'),
                item.searchParameters,
              )}
            >
              {item.label}
            </EinLink>
          </h2>
        </ListItem>
      )}
    />
  );
}
