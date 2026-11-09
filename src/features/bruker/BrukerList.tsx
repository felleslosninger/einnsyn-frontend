'use client';

import {
  Alert,
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
  isLagretSoek,
  isMoetemappe,
  isSaksmappe,
  type LagretSak,
  type LagretSoek,
  type PaginatedList,
} from '@digdir/einnsyn-sdk';
import { TrashIcon } from '@navikt/aksel-icons';
import { useCallback, useRef, useState, useTransition } from 'react';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinLink } from '~/components/EinLink/EinLink';
import { EinScrollTrigger } from '~/components/EinScrollTrigger/EinScrollTrigger';
import JournalpostResult from '~/features/search/searchresult/JournalpostResult';
import MoetemappeResult from '~/features/search/searchresult/MoetemappeResult';
import SaksmappeResult from '~/features/search/searchresult/SaksmappeResult';
import { SearchResultSkeleton } from '~/features/search/searchresult/SearchResultSkeleton';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import { toLocalizedPath } from '~/lib/routing/pathname';
import cn from '~/lib/utils/className';
import { dateFormat } from '~/lib/utils/dateFormat';
import { fetchNextPage } from '~/lib/utils/pagination';
import { skeletonLength } from '~/lib/utils/skeletonUtils';
import styles from './BrukerList.module.scss';
import {
  deleteBrukerItemAction,
  setBrukerItemSubscriptionAction,
} from './bruker.actions';
import { savedSearchHref } from './saved-searches/savedSearchHref';

export type BrukerListType =
  | 'savedSearches'
  | 'savedCases'
  | 'savedMeetings'
  | 'accessRequests';

type Item = LagretSoek | LagretSak | Innsynskrav;

// Defined once, so React calls it only when the element mounts.
const focusElement = (element: HTMLElement | null) => {
  element?.focus();
};

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
  const [loadFailed, setLoadFailed] = useState(false);

  const scrollTriggerHandler = useCallback(async () => {
    // A failed request rejects. Scrolling back to the trigger tries again.
    const nextPage = await fetchNextPage(page).catch(() => null);
    setLoadFailed(!nextPage);
    if (nextPage) {
      setPage(nextPage);
    }
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
  const isEmpty = !items.length && !page.next;

  return (
    <>
      {isEmpty ? (
        // Takes focus when the last item is deleted.
        <Paragraph
          tabIndex={-1}
          ref={deletedIds.length ? focusElement : undefined}
        >
          {t(`bruker.${type}Page.empty`)}
        </Paragraph>
      ) : (
        <>
          <ul className={styles.list}>
            {items.map((item) => (
              <BrukerListItem
                key={item.id}
                item={item}
                onDelete={() => setDeletedIds((ids) => [...ids, item.id])}
              />
            ))}
          </ul>
          {page.next && (
            <EinScrollTrigger onEnter={scrollTriggerHandler}>
              {loadFailed ? (
                <Alert data-color="danger">{t('bruker.loadError')}</Alert>
              ) : (
                <BrukerListSkeleton type={type} />
              )}
            </EinScrollTrigger>
          )}
        </>
      )}
      <div role="status" className="ds-sr-only">
        {/* A new key per deletion, so each one is announced. */}
        {deletedIds.length > 0 && (
          <span key={deletedIds.length}>{t('common.deleted')}</span>
        )}
      </div>
    </>
  );
}

/**
 * Placeholder items, laid out like the real ones so the list does not shift
 * when they load.
 */
export function BrukerListSkeleton({ type }: { type: BrukerListType }) {
  return (
    <ul className={styles.list} aria-hidden="true">
      {[0, 1].map((index) => (
        <li key={index} className={styles.item}>
          <div className={styles.main}>
            {type === 'savedSearches' ? (
              <h2 className={cn('ds-heading', styles.title)}>
                <Skeleton variant="text" width={skeletonLength(index, 3, 30)} />
              </h2>
            ) : (
              <SearchResultSkeleton className={styles.result} index={index} />
            )}
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

function getTitle(item: Item): string | undefined {
  if (isLagretSoek(item)) {
    return item.label;
  }
  if (isLagretSak(item) && isSaksmappe(item.saksmappe)) {
    return item.saksmappe.offentligTittel;
  }
  if (isLagretSak(item) && isMoetemappe(item.moetemappe)) {
    return item.moetemappe.offentligTittel;
  }
  if (isInnsynskrav(item) && isJournalpost(item.journalpost)) {
    return item.journalpost.offentligTittel;
  }
  return undefined;
}

function BrukerListItem({
  item,
  onDelete,
}: {
  item: Item;
  onDelete: () => void;
}) {
  const t = useTranslation();
  const languageCode = useLanguageCode();
  const itemRef = useRef<HTMLLIElement>(null);
  const [error, setError] = useState<string>();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [subscribe, setSubscribe] = useState(
    !isInnsynskrav(item) && item.subscribe === true,
  );
  const [isUpdating, setIsUpdating] = useState(false);

  // Every item has the same controls, so screen readers also get the title.
  const hiddenTitle = <span className="ds-sr-only"> {getTitle(item)}</span>;

  const handleSubscribeChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    // One update at a time, so `!checked` is always the last saved value.
    if (isUpdating) {
      return;
    }
    const checked = e.target.checked;
    setError(undefined);
    setSubscribe(checked);
    setIsUpdating(true);
    const entity = isLagretSoek(item) ? 'LagretSoek' : 'LagretSak';
    // A failed API call returns false, but a failed request rejects.
    const saved = await setBrukerItemSubscriptionAction(
      entity,
      item.id,
      checked,
    ).catch(() => false);
    setIsUpdating(false);
    if (!saved) {
      setSubscribe(!checked);
      setError(t('bruker.subscribeError'));
    }
  };

  const handleDelete = () => {
    if (isDeleting) {
      return;
    }
    setError(undefined);
    startDeleteTransition(async () => {
      if (
        await deleteBrukerItemAction(item.entity, item.id).catch(() => false)
      ) {
        // Keep keyboard focus in the list as this item's button disappears:
        // on the next item, or the previous one if this was the last.
        const neighbour =
          itemRef.current?.nextElementSibling ??
          itemRef.current?.previousElementSibling;
        neighbour?.querySelector<HTMLElement>('a, button')?.focus();
        onDelete();
      } else {
        setError(t('bruker.deleteError'));
      }
    });
  };

  return (
    <li ref={itemRef} className={styles.item}>
      <div className={styles.row}>
        <div className={styles.main}>
          {isLagretSoek(item) && (
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
          )}
          {isLagretSak(item) && isSaksmappe(item.saksmappe) && (
            <SaksmappeResult className={styles.result} item={item.saksmappe} />
          )}
          {isLagretSak(item) && isMoetemappe(item.moetemappe) && (
            <MoetemappeResult
              className={styles.result}
              item={item.moetemappe}
            />
          )}
          {isInnsynskrav(item) && isJournalpost(item.journalpost) && (
            <JournalpostResult
              className={styles.result}
              item={item.journalpost}
            />
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
          {!isInnsynskrav(item) && (
            <Switch
              data-size="sm"
              checked={subscribe}
              onChange={handleSubscribeChange}
              label={
                <>
                  {t('common.subscribe')}
                  {hiddenTitle}
                </>
              }
            />
          )}
          <EinButton
            variant="tertiary"
            data-size="sm"
            loading={isDeleting}
            onClick={handleDelete}
          >
            {!isDeleting && <TrashIcon aria-hidden="true" />}
            {t('common.delete')}
            {hiddenTitle}
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
