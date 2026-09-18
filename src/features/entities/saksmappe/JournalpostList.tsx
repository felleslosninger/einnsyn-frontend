'use client';

import { Skeleton } from '@digdir/designsystemet-react';
import {
  isEnhet,
  type Journalpost,
  type PaginatedList,
  type Saksmappe,
} from '@digdir/einnsyn-sdk';
import { SortDownIcon, XMarkIcon } from '@navikt/aksel-icons';
import { useCallback, useMemo, useRef } from 'react';
import { WindowVirtualizer, type WindowVirtualizerHandle } from 'virtua';
import { EinExpandable } from '~/components/EinExpandable/EinExpandable';
import { EinLink } from '~/components/EinLink/EinLink';
import { EinScrollTrigger } from '~/components/EinScrollTrigger/EinScrollTrigger';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import DocumentActions from '~/features/entities/common/DocumentActions';
import JournalpostContainer from '~/features/entities/journalpost/JournalpostContainer';
import JournalpostContainerSkeleton from '~/features/entities/journalpost/JournalpostContainerSkeleton';
import { Korrespondansepart } from '~/features/entities/journalpost/Korrespondansepart';
import { useInfiniteScroll } from '~/hooks/useInfiniteScroll';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useScrollToExpanded } from '~/hooks/useScrollToExpanded';
import { useTranslation } from '~/hooks/useTranslation';
import {
  getJournalpostFromPath,
  getSaksmappeFromPath,
} from '~/lib/routes/sections';
import cn from '~/lib/utils/className';
import { dateFormat } from '~/lib/utils/dateFormat';
import { getName } from '~/lib/utils/enhetUtils';
import { skeletonLength } from '~/lib/utils/skeletonUtils';
import {
  useJournalpostURLGenerator,
  useSaksmappeURLGenerator,
} from '~/lib/utils/urlGenerators';
import styles from './JournalpostList.module.scss';

type JournalpostTypeKind =
  | 'inngaaende'
  | 'utgaaende'
  | 'organinternt'
  | 'saksframlegg'
  | 'sakskart'
  | 'moeteprotokoll'
  | 'moetebok';

function journalpostKind(
  type: Journalpost['journalposttype'],
): JournalpostTypeKind | undefined {
  if (type === 'inngaaende_dokument') return 'inngaaende';
  if (type === 'utgaaende_dokument') return 'utgaaende';
  if (type.startsWith('organinternt')) return 'organinternt';
  if (type === 'saksframlegg') return 'saksframlegg';
  if (type === 'sakskart') return 'sakskart';
  if (type === 'moeteprotokoll') return 'moeteprotokoll';
  if (type === 'moetebok') return 'moetebok';
  return undefined;
}

function journalpostIdentifier(j: Journalpost): string {
  return j.slug ?? j.id;
}

// Path segments arrive percent-encoded; slugs on an entity do not.
function decodeIdentifier(identifier: string | undefined): string | undefined {
  if (identifier === undefined) return undefined;
  try {
    return decodeURIComponent(identifier);
  } catch {
    return identifier;
  }
}

// Extend the loaded window when a sentinel comes within this of the viewport.
const EXTEND_MARGIN = '800px';

export default function JournalpostList({
  journalposts,
  saksmappe,
  children,
}: {
  journalposts: PaginatedList<Journalpost>;
  saksmappe: Saksmappe;
  children?: React.ReactNode;
}) {
  const t = useTranslation();
  const languageCode = useLanguageCode();
  const { pathname, optimisticPathname } = useNavigation();

  const { page, extendBackward, extendForward, shift } =
    useInfiniteScroll(journalposts);
  const vlistRef = useRef<WindowVirtualizerHandle>(null);

  const selectedJournalpostIdentifier = useMemo(() => {
    return decodeIdentifier(getJournalpostFromPath(pathname));
  }, [pathname]);

  // The optimistic pathname opens the row on click, before the route resolves.
  const optimisticJournalpostIdentifier = useMemo(() => {
    return decodeIdentifier(getJournalpostFromPath(optimisticPathname));
  }, [optimisticPathname]);

  // The navigation target resolved from the in-memory list, so the expansion
  // renders real metadata immediately and skeletons only the documents.
  const optimisticJournalpost = useMemo(() => {
    if (!optimisticJournalpostIdentifier) {
      return undefined;
    }
    return page.items.find(
      (j) => journalpostIdentifier(j) === optimisticJournalpostIdentifier,
    );
  }, [page.items, optimisticJournalpostIdentifier]);

  // Every in-view link uses the saksmappe identifier from the current URL: a
  // slug/id mismatch between links would change the `[saksmappe]` route param
  // on open/close and remount the subtree, canceling the transition.
  const saksmappeURL = useSaksmappeURLGenerator();
  const journalpostURL = useJournalpostURLGenerator();
  const saksmappeRef = getSaksmappeFromPath(pathname) || saksmappe;
  const saksmappeHref = saksmappeURL(saksmappeRef);
  const journalpostHref = useCallback(
    (j: Journalpost) => journalpostURL(j, saksmappeRef),
    [journalpostURL, saksmappeRef],
  );
  const ownerEnhetName = isEnhet(saksmappe.administrativEnhetObjekt)
    ? getName(saksmappe.administrativEnhetObjekt, languageCode)
    : '';

  const selectedIndex = useMemo(() => {
    if (!optimisticJournalpostIdentifier) {
      return -1;
    }
    return page.items.findIndex(
      (j) => journalpostIdentifier(j) === optimisticJournalpostIdentifier,
    );
  }, [page.items, optimisticJournalpostIdentifier]);
  // Ref so `scrollToSelected` stays stable when paging shifts the index.
  const selectedIndexRef = useRef(selectedIndex);
  selectedIndexRef.current = selectedIndex;

  // Called when the selected row isn't mounted — a history navigation to a
  // journalpost outside virtua's rendered window.
  const scrollToSelected = useCallback((headerInset: number) => {
    if (selectedIndexRef.current < 0) return;
    vlistRef.current?.scrollToIndex(selectedIndexRef.current, {
      align: 'start',
      offset: -headerInset,
    });
  }, []);
  const { rootRef, onExpand } = useScrollToExpanded({
    expandedKey: optimisticJournalpostIdentifier,
    scrollToItem: scrollToSelected,
  });

  // Digit count of the widest loaded journalpostnummer; the stylesheet turns
  // it into the `--jp-number-col` width.
  const numberColChars = useMemo(() => {
    let maxChars = 0;
    for (const j of page.items) {
      maxChars = Math.max(
        maxChars,
        j.journalpostnummer?.toString().length ?? 0,
      );
    }
    return maxChars;
  }, [page.items]);

  // `children` comes from the current route, so it lags while a navigation
  // is in flight.
  const isContentLoading =
    optimisticJournalpostIdentifier !== selectedJournalpostIdentifier;

  // Full skeleton only when the target isn't in the loaded window.
  const detail =
    isContentLoading || !children ? (
      optimisticJournalpost ? (
        <JournalpostContainer journalpost={optimisticJournalpost} />
      ) : (
        <JournalpostContainerSkeleton />
      )
    ) : (
      children
    );

  return (
    <div
      ref={rootRef}
      className={styles.journalpostList}
      style={{ '--jp-number-chars': numberColChars } as React.CSSProperties}
    >
      <div className={styles.listHeader}>
        <div className={styles.titleGroup}>
          <h2 className={styles.title}>{t('journalpost.labelPluralInCase')}</h2>
        </div>
        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.iconButton}
            aria-label={t('searchFilters.sorting')}
          >
            <SortDownIcon aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* No inner scroll region: the window scrolls the list. The extend
          sentinels sit outside the virtualizer, so they stay mounted at the
          ends of its full height and leave item indices alone. */}
      <div className={styles.list}>
        {page.previous && (
          <EinScrollTrigger onEnter={extendBackward} rootMargin={EXTEND_MARGIN}>
            <JournalpostListItemSkeleton index={0} />
            <JournalpostListItemSkeleton index={1} />
          </EinScrollTrigger>
        )}
        <WindowVirtualizer
          ref={vlistRef}
          shift={shift}
          ssrCount={page.items.length}
          itemSize={120}
        >
          {page.items.map((j) => {
            const selected =
              journalpostIdentifier(j) === optimisticJournalpostIdentifier;
            return (
              <JournalpostListItem
                key={j.id}
                journalpost={j}
                href={selected ? saksmappeHref : journalpostHref(j)}
                ownerEnhetName={ownerEnhetName}
                selected={selected}
                languageCode={languageCode}
                onExpand={onExpand}
              >
                {selected ? detail : null}
              </JournalpostListItem>
            );
          })}
        </WindowVirtualizer>
        {page.next && (
          <EinScrollTrigger onEnter={extendForward} rootMargin={EXTEND_MARGIN}>
            <JournalpostListItemSkeleton index={2} />
            <JournalpostListItemSkeleton index={3} />
          </EinScrollTrigger>
        )}
      </div>
    </div>
  );
}

// The rows waiting at either end of the loaded window, in the shape of the ones
// that will replace them: number, title, meta, correspondence. Hidden from
// assistive tech — there is nothing here to read yet, and the rows arrive on
// their own.
function JournalpostListItemSkeleton({ index }: { index: number }) {
  // Three lines per row, so each placeholder takes its own stretch of the
  // width cycle instead of repeating the one above it.
  const line = index * 3;

  return (
    <div className={styles.item} aria-hidden="true">
      <div className={styles.itemRow}>
        <span className={styles.itemNumber}>
          <Skeleton variant="text" width={2} />
        </span>
        <div className={styles.itemBody}>
          <div className={styles.itemTitle}>
            <Skeleton variant="text" width={skeletonLength(line, 30, 60)} />
          </div>
          <div className={styles.itemMeta}>
            {/* Wrapped: a text skeleton is sized by its own content, and this
                flex parent would stretch it to the full width instead. */}
            <span>
              <Skeleton
                variant="text"
                width={skeletonLength(line + 1, 20, 40)}
              />
            </span>
          </div>
          <div className={styles.itemKorr}>
            <Skeleton variant="text" width={skeletonLength(line + 2, 15, 30)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function JournalpostListItem({
  journalpost,
  href,
  ownerEnhetName,
  selected,
  languageCode,
  onExpand,
  children,
}: {
  journalpost: Journalpost;
  href: string;
  ownerEnhetName: string;
  selected: boolean;
  languageCode: ReturnType<typeof useLanguageCode>;
  onExpand: (expandable: HTMLElement, contentHeight: number) => void;
  children?: React.ReactNode;
}) {
  const t = useTranslation();
  const kind = journalpostKind(journalpost.journalposttype);

  return (
    <div
      className={cn(styles.item, { [styles.selected]: selected })}
      // Lets `useScrollToExpanded` find the expanded row across virtua remounts.
      data-expanded={selected || undefined}
    >
      <div className={styles.itemRow}>
        {/* Readable text, not a link: the number must reach assistive tech. */}
        <span className={styles.itemNumber}>
          {journalpost.journalpostnummer}
        </span>
        <div className={styles.itemBody}>
          <EinLink
            href={href}
            // Expands in place — keep the reading position.
            scroll={false}
            className={styles.itemTitle}
            aria-expanded={selected}
          >
            {journalpost.offentligTittel}
          </EinLink>
          <div className={styles.itemMeta}>
            <span>{t(`searchFilters.journalpostTypes.${kind}`)}</span>
            {journalpost.publisertDato && (
              <span>
                {t('common.publishedAt')}{' '}
                {dateFormat(journalpost.publisertDato, languageCode)}
              </span>
            )}
            {journalpost.oppdatertDato &&
              journalpost.oppdatertDato !== journalpost.publisertDato && (
                <span>
                  {t('common.updatedAt')}{' '}
                  {dateFormat(journalpost.oppdatertDato, languageCode)}
                </span>
              )}
          </div>
          <Korrespondansepart
            journalpost={journalpost}
            owner={ownerEnhetName}
            className={styles.itemKorr}
          />
        </div>
        {selected ? (
          // The expansion lists the same documents, so the action would be a
          // second copy of what is already on screen. Same href as the title.
          <EinLink
            href={href}
            scroll={false}
            aria-label={t('common.close')}
            className={cn(
              styles.iconButton,
              styles.itemAction,
              styles.itemClose,
            )}
            unstyled
          >
            <XMarkIcon aria-hidden="true" />
          </EinLink>
        ) : (
          // In the row so it's reachable without opening the journalpost.
          <DocumentActions
            dokumentbeskrivelse={journalpost.dokumentbeskrivelse}
            className={styles.itemAction}
          />
        )}
      </div>

      <EinExpandable
        expanded={selected}
        onExpand={onExpand}
        className={styles.expansion}
        contentClassName={styles.expansionContent}
      >
        {children}
      </EinExpandable>
    </div>
  );
}
