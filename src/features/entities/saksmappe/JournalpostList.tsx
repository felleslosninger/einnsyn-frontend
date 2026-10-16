'use client';

import { Skeleton } from '@digdir/designsystemet-react';
import type {
  Journalpost,
  PaginatedList,
  Saksmappe,
} from '@digdir/einnsyn-sdk';
import {
  ChevronDownIcon,
  EnvelopeOpenIcon,
  FileTextIcon,
  PaperplaneIcon,
  SortDownIcon,
} from '@navikt/aksel-icons';
import { useCallback, useId, useMemo, useRef } from 'react';
import { WindowVirtualizer, type WindowVirtualizerHandle } from 'virtua';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinExpandable } from '~/components/EinExpandable/EinExpandable';
import { EinLink } from '~/components/EinLink/EinLink';
import { EinScrollTrigger } from '~/components/EinScrollTrigger/EinScrollTrigger';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import JournalpostContainer from '~/features/entities/journalpost/JournalpostContainer';
import JournalpostContainerSkeleton from '~/features/entities/journalpost/JournalpostContainerSkeleton';
import { partyNames } from '~/features/entities/journalpost/Korrespondansepart';
import { useInfiniteScroll } from '~/hooks/useInfiniteScroll';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useScrollToExpanded } from '~/hooks/useScrollToExpanded';
import { useTranslation } from '~/hooks/useTranslation';
import { buildPathname, parsePathname } from '~/lib/routing/pathname';
import cn from '~/lib/utils/className';
import { dateFormat } from '~/lib/utils/dateFormat';
import { skeletonLength } from '~/lib/utils/skeletonUtils';
import { getSaksmappeRoute } from '~/lib/utils/urlGenerators';
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

// A URL may name a journalpost by its id even when the list's links use the slug.
function hasIdentifier(j: Journalpost, identifier: string): boolean {
  return j.slug === identifier || j.id === identifier;
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

  const currentRoute = useMemo(() => parsePathname(pathname), [pathname]);
  const selectedJournalpostIdentifier = currentRoute?.journalpostIdentifier;

  // The optimistic pathname opens the row on click, before the route resolves.
  const optimisticJournalpostIdentifier = useMemo(() => {
    return parsePathname(optimisticPathname)?.journalpostIdentifier;
  }, [optimisticPathname]);

  const selectedIndex = useMemo(() => {
    if (!optimisticJournalpostIdentifier) {
      return -1;
    }
    return page.items.findIndex((j) =>
      hasIdentifier(j, optimisticJournalpostIdentifier),
    );
  }, [page.items, optimisticJournalpostIdentifier]);

  // The navigation target resolved from the in-memory list, so the expansion
  // renders real metadata immediately and skeletons only the documents.
  const optimisticJournalpost = useMemo(() => {
    const journalpost = page.items[selectedIndex];
    // The list leaves `saksmappe` unexpanded, and the detail shows its number.
    return journalpost && { ...journalpost, saksmappe };
  }, [page.items, selectedIndex, saksmappe]);

  // Every in-view link reuses the enhet and saksmappe identifiers in the URL: a
  // slug/id swap would change a route param on open/close and remount the
  // subtree, canceling the transition.
  const { enhetIdentifier, saksmappeIdentifier } =
    currentRoute?.saksmappeIdentifier !== undefined
      ? currentRoute
      : getSaksmappeRoute(saksmappe);
  const saksmappeHref = buildPathname(
    { enhetIdentifier, saksmappeIdentifier },
    languageCode,
  );
  const journalpostHref = useCallback(
    (j: Journalpost) =>
      buildPathname(
        {
          enhetIdentifier,
          saksmappeIdentifier,
          journalpostIdentifier: journalpostIdentifier(j),
        },
        languageCode,
      ),
    [enhetIdentifier, saksmappeIdentifier, languageCode],
  );

  // Ref so `scrollToSelected` stays stable when paging shifts the index.
  const selectedIndexRef = useRef(selectedIndex);
  selectedIndexRef.current = selectedIndex;

  // Called when the selected row isn't mounted — a history navigation to a
  // journalpost outside virtua's rendered window.
  const scrollToSelected = useCallback((top: number) => {
    if (selectedIndexRef.current < 0) return;
    vlistRef.current?.scrollToIndex(selectedIndexRef.current, {
      align: 'start',
      offset: -top,
    });
  }, []);
  const { rootRef, onExpand } = useScrollToExpanded({
    expandedKey: optimisticJournalpostIdentifier,
    scrollToItem: scrollToSelected,
  });

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
    <div ref={rootRef} className={styles.journalpostList}>
      <div className={styles.listHeader}>
        <div className={styles.titleGroup}>
          <h2 className="ds-heading" data-size="2xs">
            {t('journalpost.labelPluralInCase')}
          </h2>
        </div>
        <div className={styles.toolbar}>
          <EinButton
            variant="tertiary"
            icon
            data-color="neutral"
            data-size="sm"
            aria-label={t('searchFilters.sorting')}
          >
            <SortDownIcon aria-hidden="true" />
          </EinButton>
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
          {page.items.map((j, index) => {
            const selected = index === selectedIndex;
            return (
              <JournalpostListItem
                key={j.id}
                journalpost={j}
                href={selected ? saksmappeHref : journalpostHref(j)}
                selected={selected}
                first={index === 0 && !page.previous}
                last={index === page.items.length - 1 && !page.next}
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
// that will replace them. Hidden from assistive tech — there is nothing here to
// read yet, and the rows arrive on their own.
function JournalpostListItemSkeleton({ index }: { index: number }) {
  // Three lines per row, so each placeholder takes its own stretch of the
  // width cycle instead of repeating the one above it.
  const line = index * 3;

  return (
    <div className={styles.item} aria-hidden="true">
      <span className={styles.node} />
      <div className={styles.card}>
        <div className={styles.summary}>
          <div className={styles.itemMeta}>
            {/* Wrapped: a text skeleton is sized by its own content, and this
                flex parent would stretch it to the full width instead. */}
            <span>
              <Skeleton variant="text" width={skeletonLength(line, 20, 40)} />
            </span>
          </div>
          <div className={styles.itemTitle}>
            <Skeleton variant="text" width={skeletonLength(line + 1, 30, 60)} />
          </div>
          <div className={styles.itemKorr}>
            <Skeleton variant="text" width={skeletonLength(line + 2, 15, 30)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function KindIcon({ kind }: { kind: JournalpostTypeKind | undefined }) {
  if (kind === 'inngaaende') {
    return <EnvelopeOpenIcon />;
  }
  if (kind === 'utgaaende') {
    return <PaperplaneIcon />;
  }
  return <FileTextIcon />;
}

function JournalpostListItem({
  journalpost,
  href,
  selected,
  first,
  last,
  languageCode,
  onExpand,
  children,
}: {
  journalpost: Journalpost;
  href: string;
  selected: boolean;
  // The ends of the whole list, where the timeline stops at the node.
  first: boolean;
  last: boolean;
  languageCode: ReturnType<typeof useLanguageCode>;
  onExpand: (expandable: HTMLElement, contentHeight: number) => void;
  children?: React.ReactNode;
}) {
  const t = useTranslation();
  const titleId = useId();
  const kind = journalpostKind(journalpost.journalposttype);
  const date =
    journalpost.dokumentetsDato ??
    journalpost.journaldato ??
    journalpost.publisertDato;

  // The saksmappe's owner is the other party, so only the counterpart is named.
  const counterpartRole =
    kind === 'inngaaende' ? ('avsender' as const) : ('mottaker' as const);
  const [counterpart, ...otherCounterparts] = partyNames(
    journalpost,
    counterpartRole,
  );

  return (
    <div
      className={cn(styles.item, {
        [styles.selected]: selected,
        [styles.first]: first,
        [styles.last]: last,
      })}
      // On every row: `useScrollToExpanded` finds the expanded one across
      // virtua remounts, and reads the rows' scroll margin from any of them.
      data-expanded={selected}
    >
      {/* Designsystemet delegates clicks on the node and the summary to the
          title link, so the whole row opens it. */}
      <span
        className={styles.node}
        aria-hidden="true"
        data-clickdelegatefor={titleId}
      >
        <KindIcon kind={kind} />
      </span>
      <div className={styles.card}>
        <div className={styles.summary} data-clickdelegatefor={titleId}>
          <div className={styles.itemMeta}>
            <span className={styles.itemNumber}>
              {t('journalpost.label')} {journalpost.journalpostnummer}
            </span>
            {date && <span>{dateFormat(date, languageCode)}</span>}
            {kind && <span>{t(`searchFilters.journalpostTypes.${kind}`)}</span>}
          </div>
          <EinLink
            id={titleId}
            href={href}
            // Expands in place — keep the reading position.
            scroll={false}
            className={styles.itemTitle}
            aria-expanded={selected}
          >
            {journalpost.offentligTittel}
          </EinLink>
          {counterpart && (
            <div className={styles.itemKorr}>
              <span className={styles.direction}>
                {t(
                  counterpartRole === 'avsender'
                    ? 'journalpost.from'
                    : 'journalpost.to',
                )}
                :
              </span>{' '}
              {counterpart}
              {otherCounterparts.length > 0 &&
                ` ${t('common.andMore', String(otherCounterparts.length))}`}
            </div>
          )}
          <ChevronDownIcon className={styles.chevron} aria-hidden="true" />
        </div>

        <EinExpandable
          expanded={selected}
          onExpand={onExpand}
          contentClassName={styles.expansionContent}
        >
          {children}
        </EinExpandable>
      </div>
    </div>
  );
}
