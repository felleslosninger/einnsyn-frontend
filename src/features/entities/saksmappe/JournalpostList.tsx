'use client';

import {
  isEnhet,
  type Journalpost,
  type PaginatedList,
  type Saksmappe,
} from '@digdir/einnsyn-sdk';
import { ChevronDownIcon, SortDownIcon } from '@navikt/aksel-icons';
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
          <EinScrollTrigger
            onEnter={extendBackward}
            rootMargin={EXTEND_MARGIN}
          />
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
          <EinScrollTrigger
            onEnter={extendForward}
            rootMargin={EXTEND_MARGIN}
          />
        )}
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
          <span className={styles.numberBadge}>
            {journalpost.journalpostnummer}
          </span>
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
            <span aria-hidden="true" className={styles.metaSeparator}>
              —
            </span>
            {journalpost.publisertDato && (
              <span>
                {t('common.publishedAt')}{' '}
                {dateFormat(journalpost.publisertDato, languageCode)}
              </span>
            )}
            {journalpost.oppdatertDato &&
              journalpost.oppdatertDato !== journalpost.publisertDato && (
                <>
                  <span aria-hidden="true" className={styles.metaSeparator}>
                    —
                  </span>
                  <span>
                    {t('common.updatedAt')}{' '}
                    {dateFormat(journalpost.oppdatertDato, languageCode)}
                  </span>
                </>
              )}
          </div>
          <Korrespondansepart
            journalpost={journalpost}
            owner={ownerEnhetName}
            className={styles.itemKorr}
          />
        </div>
        {/* In the row so it's reachable without opening the journalpost. */}
        <DocumentActions
          dokumentbeskrivelse={journalpost.dokumentbeskrivelse}
          className={styles.itemAction}
        />
        {/* Duplicate pointer target, hidden from assistive tech: the row
            exposes a single link whose `aria-expanded` carries the state. */}
        <EinLink
          href={href}
          scroll={false}
          className={styles.itemToggle}
          aria-hidden="true"
          tabIndex={-1}
          unstyled
        >
          <ChevronDownIcon aria-hidden="true" />
        </EinLink>
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
