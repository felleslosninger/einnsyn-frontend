'use client';

import {
  Alert,
  Paragraph,
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
  use,
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
import cn from '~/lib/utils/className';
import { dateFormat } from '~/lib/utils/dateFormat';
import { fetchNextPage } from '~/lib/utils/pagination';
import styles from './BrukerList.module.scss';
import { deleteBrukerItem, setLagretSakSubscription } from './bruker.actions';

export type BrukerListType = 'savedCases' | 'savedMeetings' | 'accessRequests';

type Item = LagretSak | Innsynskrav;

export default function BrukerListItems({
  type,
  initialPage,
}: {
  type: BrukerListType;
  initialPage: Promise<PaginatedList<Item> | null>;
}) {
  const t = useTranslation();
  const [page, setPage] = useState(use(initialPage));
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  const loadNextPage = useCallback(async () => {
    if (page) setPage(await fetchNextPage(page));
  }, [page]);

  if (!page) {
    return <Alert data-color="danger">{t('bruker.loadError')}</Alert>;
  }

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
            item={item}
            type={type}
            onDelete={() => setDeletedIds((ids) => [...ids, item.id])}
          />
        ))}
      </ul>
      {page.next && (
        <EinScrollTrigger onEnter={loadNextPage}>
          <SearchResultSkeleton index={0} />
        </EinScrollTrigger>
      )}
    </>
  );
}

function BrukerListItem({
  item,
  type,
  onDelete,
}: {
  item: Item;
  type: BrukerListType;
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
      if (await setLagretSakSubscription(item.id, checked)) {
        setSubscribe(checked);
      } else {
        setError(t('bruker.subscribeError'));
      }
    });
  };

  const handleDelete = () => {
    setError(undefined);
    startDeleteTransition(async () => {
      if (await deleteBrukerItem(item.entity, item.id)) {
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
            <span className={cn('ds-paragraph', styles.meta)} data-size="sm">
              {item.sent
                ? `${t('bruker.accessRequestsPage.sentAt')} ${dateFormat(item.sent, languageCode)}`
                : t('bruker.accessRequestsPage.notSent')}
            </span>
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
            <TrashIcon aria-hidden />
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
