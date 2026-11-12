'use client';

import {
  isMoetemappe,
  isSaksmappe,
  type LagretSak,
  type PaginatedList,
} from '@digdir/einnsyn-sdk';
import MoetemappeResult from '~/features/search/searchresult/MoetemappeResult';
import SaksmappeResult from '~/features/search/searchresult/SaksmappeResult';
import { SearchResultSkeleton } from '~/features/search/searchresult/SearchResultSkeleton';
import { useTranslation } from '~/hooks/useTranslation';
import InfiniteList from '../InfiniteList';
import styles from '../List.module.scss';
import ListItem from '../ListItem';
import ListSkeleton from '../ListSkeleton';

export function LagretSakListSkeleton() {
  return (
    <ListSkeleton
      renderItem={(index) => (
        <SearchResultSkeleton className={styles.result} index={index} />
      )}
    />
  );
}

/**
 * Saved cases and saved meetings are listed together by the API, so the list
 * keeps the kind it was asked for.
 */
export default function LagretSakList({
  initialPage,
  kind,
}: {
  initialPage: PaginatedList<LagretSak>;
  kind: 'saksmappe' | 'moetemappe';
}) {
  const t = useTranslation();

  return (
    <InfiniteList
      initialPage={initialPage}
      skeleton={<LagretSakListSkeleton />}
      emptyText={t(
        kind === 'saksmappe'
          ? 'bruker.savedCasesPage.empty'
          : 'bruker.savedMeetingsPage.empty',
      )}
      filter={(item) =>
        kind === 'saksmappe'
          ? isSaksmappe(item.saksmappe)
          : isMoetemappe(item.moetemappe)
      }
      renderItem={(item, onDelete) => {
        const { saksmappe, moetemappe } = item;
        return (
          <ListItem
            entity="LagretSak"
            id={item.id}
            title={
              isSaksmappe(saksmappe)
                ? saksmappe.offentligTittel
                : isMoetemappe(moetemappe)
                  ? moetemappe.offentligTittel
                  : undefined
            }
            subscribed={item.subscribe === true}
            onDelete={onDelete}
          >
            {isSaksmappe(saksmappe) && (
              <SaksmappeResult className={styles.result} item={saksmappe} />
            )}
            {isMoetemappe(moetemappe) && (
              <MoetemappeResult className={styles.result} item={moetemappe} />
            )}
          </ListItem>
        );
      }}
    />
  );
}
