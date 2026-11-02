'use client';

import {
  Paragraph,
  Skeleton,
  Switch,
  ValidationMessage,
} from '@digdir/designsystemet-react';
import {
  type Innsynskrav,
  isInnsynskrav,
  isJournalpost,
  isLagretSak,
  isMoetemappe,
  isSaksmappe,
  type LagretSak,
  type PaginatedList,
} from '@digdir/einnsyn-sdk';
import { TrashIcon } from '@navikt/aksel-icons';
import {
  startTransition,
  useCallback,
  useId,
  useOptimistic,
  useState,
  useTransition,
} from 'react';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinScrollTrigger } from '~/components/EinScrollTrigger/EinScrollTrigger';
import JournalpostResult from '~/features/search/searchresult/JournalpostResult';
import MoetemappeResult from '~/features/search/searchresult/MoetemappeResult';
import SaksmappeResult from '~/features/search/searchresult/SaksmappeResult';
import { SearchResultSkeleton } from '~/features/search/searchresult/SearchResultSkeleton';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import { dateFormat } from '~/lib/utils/dateFormat';
import { fetchNextPage } from '~/lib/utils/pagination';
import styles from './BrukerList.module.scss';
import {
  deleteBrukerItemAction,
  setLagretSakSubscriptionAction,
} from './bruker.actions';

export type BrukerListType = 'savedCases' | 'savedMeetings' | 'accessRequests';

type Item = LagretSak | Innsynskrav;

export default function BrukerList({
  type,
  initialPage,
}: {
  type: BrukerListType;
  initialPage: PaginatedList<Item>;
}) {
  const t = useTranslation();
  const [page, setPage] = useState(initialPage);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  const scrollTriggerHandler = useCallback(async () => {
    setPage(await fetchNextPage(page));
  }, [page]);

  // Saved cases and saved meetings are listed together by the API.
  const items = page.items.filter(
    (item) =>
      !deletedIds.includes(item.id) &&
      (!isLagretSak(item) ||
        (type === 'savedCases'
          ? isSaksmappe(item.saksmappe)
          : isMoetemappe(item.moetemappe))),
  );

  if (!items.length && !page.next) {
    return <Paragraph>{t(`bruker.${type}Page.empty`)}</Paragraph>;
  }

  return (
    <>
      <ul className={styles.list}>
        {items.map((item) => (
          <BrukerListItem
            key={item.id}
            type={type}
            item={item}
            onDelete={() => setDeletedIds((ids) => [...ids, item.id])}
          />
        ))}
      </ul>
      {page.next && (
        <EinScrollTrigger onEnter={scrollTriggerHandler}>
          <BrukerListSkeleton type={type} />
        </EinScrollTrigger>
      )}
    </>
  );
}

/**
 * Placeholder items, laid out like the real ones so the list does not shift
 * when they load.
 */
export function BrukerListSkeleton({ type }: { type: BrukerListType }) {
  return (
    <ul className={styles.list}>
      {[0, 1].map((index) => (
        <li key={index} className={styles.item}>
          <div className={styles.main}>
            <SearchResultSkeleton className={styles.result} index={index} />
            {type === 'accessRequests' && (
              <Paragraph data-size="sm" className={styles.meta}>
                <Skeleton variant="text" width={30} />
              </Paragraph>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function BrukerListItem({
  type,
  item,
  onDelete,
}: {
  type: BrukerListType;
  item: Item;
  onDelete: () => void;
}) {
  const t = useTranslation();
  const languageCode = useLanguageCode();
  const titleId = useId();
  const [error, setError] = useState<string>();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [subscribe, setSubscribe] = useState(
    isLagretSak(item) && item.subscribe === true,
  );
  const [optimisticSubscribe, setOptimisticSubscribe] =
    useOptimistic(subscribe);

  const handleSubscribeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setError(undefined);
    startTransition(async () => {
      setOptimisticSubscribe(checked);
      if (await setLagretSakSubscriptionAction(item.id, checked)) {
        setSubscribe(checked);
      } else {
        setError(t('bruker.subscribeError'));
      }
    });
  };

  const handleDelete = () => {
    setError(undefined);
    startDeleteTransition(async () => {
      if (await deleteBrukerItemAction(item.entity, item.id)) {
        onDelete();
      } else {
        setError(t('bruker.deleteError'));
      }
    });
  };

  const resultProps = { className: styles.result, titleId };

  return (
    <li className={styles.item}>
      <div className={styles.row}>
        <div className={styles.main}>
          {isLagretSak(item) && isSaksmappe(item.saksmappe) && (
            <SaksmappeResult {...resultProps} item={item.saksmappe} />
          )}
          {isLagretSak(item) && isMoetemappe(item.moetemappe) && (
            <MoetemappeResult {...resultProps} item={item.moetemappe} />
          )}
          {isInnsynskrav(item) && isJournalpost(item.journalpost) && (
            <JournalpostResult {...resultProps} item={item.journalpost} />
          )}
          {isInnsynskrav(item) && (
            <Paragraph data-size="sm" className={styles.meta}>
              {item.sent
                ? `${t('bruker.accessRequestsPage.sentAt')} ${dateFormat(item.sent, languageCode)}`
                : t('bruker.accessRequestsPage.notSent')}
            </Paragraph>
          )}
        </div>
        <div className={styles.actions}>
          {isLagretSak(item) && (
            <Switch
              data-size="sm"
              checked={optimisticSubscribe}
              onChange={handleSubscribeChange}
              label={t(`bruker.${type}Page.subscribe`)}
              aria-describedby={titleId}
            />
          )}
          <EinButton
            variant="tertiary"
            data-size="sm"
            disabled={isDeleting}
            aria-describedby={titleId}
            onClick={handleDelete}
          >
            <TrashIcon aria-hidden="true" />
            {t('common.delete')}
          </EinButton>
        </div>
      </div>
      {error && (
        <ValidationMessage data-size="sm" role="alert">
          {error}
        </ValidationMessage>
      )}
    </li>
  );
}
