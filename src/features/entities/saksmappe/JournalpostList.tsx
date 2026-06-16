'use client';

import {
  isEnhet,
  type Journalpost,
  type PaginatedList,
  type Saksmappe,
} from '@digdir/einnsyn-sdk';
import { PaperclipIcon, SortDownIcon, XMarkIcon } from '@navikt/aksel-icons';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { WindowVirtualizer, type WindowVirtualizerHandle } from 'virtua';
import { EinLink } from '~/components/EinLink/EinLink';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import JournalpostContainer from '~/features/entities/journalpost/JournalpostContainer';
import JournalpostContainerSkeleton from '~/features/entities/journalpost/JournalpostContainerSkeleton';
import { Korrespondansepart } from '~/features/entities/journalpost/Korrespondansepart';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { dateFormat } from '~/lib/utils/dateFormat';
import {
  fetchNextPage,
  fetchPreviousPage,
  mergeWindow,
} from '~/lib/utils/pagination';
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

function journalpostKey(j: Journalpost): string {
  return j.slug ?? j.id;
}

// Trigger an extension fetch when the viewport is within this many pixels of
// either edge of the loaded window.
const EXTEND_THRESHOLD_PX = 800;

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

  const [page, setPage] = useState(journalposts);
  // Tracks the widest journalpostnummer (in chars) seen in the current window
  // so `--jp-number-col` only ever grows during scroll-driven page-extends.
  const maxNumberCharsRef = useRef(1);
  // Reconcile the server window with what the client already holds whenever the
  // server hands us a fresh one (navigation / revalidation). Merge rather than
  // replace, so items the client preloaded or paged in aren't discarded; only a
  // window with no overlap (the active item is outside the loaded range)
  // replaces the list. Reset the monotonic number-width baseline too, so a new
  // saksmappe (this list instance is reused across `[saksmappe]` navigations)
  // doesn't inherit the previous case's wider column.
  useEffect(() => {
    maxNumberCharsRef.current = 1;
    setPage((current) => mergeWindow(current, journalposts));
  }, [journalposts]);

  const selectedKey = useMemo(() => {
    const match = pathname.match(/\/journalpost\/([^/?#]+)/);
    return match?.[1];
  }, [pathname]);

  // Drive the visible expanded row from the optimistic pathname so the
  // expand/collapse animation can begin the instant the user clicks a link,
  // before the server route has resolved.
  const optimisticSelectedKey = useMemo(() => {
    const match = optimisticPathname.match(/\/journalpost\/([^/?#]+)/);
    return match?.[1];
  }, [optimisticPathname]);

  // The journalpost being navigated to, resolved from the list payload we
  // already hold in memory. Lets the expanded row render real metadata
  // immediately and skeleton only the documents — the one part that needs the
  // heavier detail expand (`dokumentbeskrivelse.dokumentobjekt`).
  const optimisticJournalpost = useMemo(() => {
    if (!optimisticSelectedKey) return undefined;
    return page.items.find((j) => journalpostKey(j) === optimisticSelectedKey);
  }, [page.items, optimisticSelectedKey]);

  // Build every in-view link from the saksmappe identifier exactly as it
  // appears in the current URL. If the close link used a different identifier
  // than the journalpost links (e.g. slug vs id — the embedded
  // `journalpost.saksmappe` often lacks a slug), opening/closing would change
  // the `[saksmappe]` route param and remount the whole subtree, canceling the
  // expand/collapse transition.
  const saksmappePath = t('routing.saksmappePath');
  const journalpostPath = t('journalpost.pathName');
  const saksmappeSegment =
    pathname.split('/')[2] || saksmappe.slug || saksmappe.id;
  const saksmappeHref = `/${saksmappePath}/${saksmappeSegment}`;
  const journalpostHref = useCallback(
    (j: Journalpost) =>
      `/${saksmappePath}/${saksmappeSegment}/${journalpostPath}/${j.slug ?? j.id}`,
    [saksmappePath, saksmappeSegment, journalpostPath],
  );
  const ownerEnhetName = isEnhet(saksmappe.administrativEnhetObjekt)
    ? saksmappe.administrativEnhetObjekt.navn
    : '';

  // Drive the active row and its highlight from the optimistic key so they stay
  // in agreement with the expanded content during the loading window — the row
  // already shows the optimistic target, so the highlight must point at it too.
  const selectedIndex = useMemo(() => {
    if (!optimisticSelectedKey) return -1;
    return page.items.findIndex(
      (j) => journalpostKey(j) === optimisticSelectedKey,
    );
  }, [page.items, optimisticSelectedKey]);

  // Size the number column to fit the widest journalpostnummer in the loaded
  // window. The number renders inside `.numberBadge` (a bordered pill), so the
  // cell width is the badge — `max(--jp-badge-size, digits + badge padding +
  // border)` — plus the cell's own horizontal padding. Mirrors the badge's own
  // min-width so the column var matches the rendered cell width and every row's
  // body text starts at the same x.
  const numberColWidth = useMemo(() => {
    let maxChars = 1;
    for (const j of page.items) {
      const n = j.journalpostnummer;
      if (n == null) continue;
      const len = String(n).length;
      if (len > maxChars) maxChars = len;
    }
    // Only ever grow: a page-extend that drops the widest number shouldn't
    // reflow the column narrower mid-scroll.
    maxChars = Math.max(maxChars, maxNumberCharsRef.current);
    maxNumberCharsRef.current = maxChars;
    return `calc(max(var(--jp-badge-size), ${maxChars}ch + var(--jp-badge-pad) * 2 + var(--ds-border-width-default) * 2) + var(--ds-size-2) * 2)`;
  }, [page.items]);

  // `children` is rendered by the *current* (non-optimistic) route, so it
  // mismatches the target while a navigation is in flight. Render the partial
  // detail (real metadata, skeleton documents) in that window.
  const isContentLoading = optimisticSelectedKey !== selectedKey;

  // Skeleton the documents only when the in-memory item doesn't carry them yet.
  // List-window items hold `dokumentbeskrivelse` as unexpanded ids (strings),
  // but the deep-linked item is already detail-expanded — render its documents
  // straight away rather than shimmering data we already have.
  const optimisticDocsPending = (
    optimisticJournalpost?.dokumentbeskrivelse ?? []
  ).some((db) => typeof db === 'string');

  // While the detail route resolves, reuse the list-payload journalpost so the
  // header and metadata appear instantly; only the documents shimmer. Fall back
  // to the full skeleton when the target isn't in the loaded window (e.g. a
  // history navigation to a journalpost outside it).
  const loadingDetail = optimisticJournalpost ? (
    <JournalpostContainer
      journalpost={optimisticJournalpost}
      documentsPending={optimisticDocsPending}
      inline
    />
  ) : (
    <JournalpostContainerSkeleton inline />
  );

  // The content for the open row: the resolved route content once it matches the
  // selected key, otherwise the optimistic in-memory render so the row can
  // expand instantly without waiting for the detail route.
  const selectedDetail =
    isContentLoading || !children ? loadingDetail : children;

  const vlistRef = useRef<WindowVirtualizerHandle>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const loadingPrevRef = useRef(false);
  const loadingNextRef = useRef(false);
  // `shift`: while true, Virtua keeps the scroll anchored to the END as items
  // are added at the start, so a prepend (loading earlier posts) doesn't shift
  // the visible content. Per Virtua's bidirectional pattern it's a *direction
  // flag*, not a one-shot: set true before a prepend and left true — so the
  // anchor survives the async ResizeObserver measurement of the freshly
  // prepended (variable-height) rows, which is what otherwise jumps — and
  // flipped back to false only before an append.
  const [shift, setShift] = useState(false);

  const extendBackward = useCallback(async () => {
    if (loadingPrevRef.current) return;
    loadingPrevRef.current = true;
    setShift(true);
    try {
      const merged = await fetchPreviousPage(page);
      setPage(merged);
    } finally {
      loadingPrevRef.current = false;
    }
  }, [page]);

  const extendForward = useCallback(async () => {
    if (loadingNextRef.current) return;
    loadingNextRef.current = true;
    setShift(false);
    try {
      const merged = await fetchNextPage(page);
      setPage(merged);
    } finally {
      loadingNextRef.current = false;
    }
  }, [page]);

  // The list scrolls with the page (WindowVirtualizer), so `scrollOffset` is the
  // window scroll (page-space) while `getItemOffset`/`getItemSize` stay
  // list-relative. Normalize the two by measuring the list's document-top.
  // `getBoundingClientRect().top + scrollY` is the list's absolute position in
  // the document (stable across scroll; only moves when the layout/header
  // changes), so it must be re-read on each call rather than cached.
  const listRelativeViewport = useCallback(() => {
    const listEl = listRef.current;
    if (!listEl) return null;
    const handle = vlistRef.current;
    if (!handle) return null;
    const listTop = listEl.getBoundingClientRect().top + window.scrollY;
    // Height of the sticky site header the list scrolls under, so we can treat
    // the area it covers as "not visible".
    const stickyTop =
      document.querySelector('header')?.getBoundingClientRect().height ?? 0;
    return {
      handle,
      // Window scroll expressed in the list's own coordinate space.
      rel: handle.scrollOffset - listTop,
      stickyTop,
      viewportSize: handle.viewportSize,
    };
  }, []);

  // Keep the selected item visible, but only nudge the scroll when it's actually
  // off-screen (or hidden under the sticky header) — an already-visible item
  // (the common case when opening) stays put, so the row expands in place
  // without yanking the page.
  useEffect(() => {
    if (selectedIndex < 0) return;
    const v = listRelativeViewport();
    if (!v) return;

    const itemTop = v.handle.getItemOffset(selectedIndex);
    const itemBottom = itemTop + v.handle.getItemSize(selectedIndex);
    // Usable viewport in list-space; the header overlays the top `stickyTop` px.
    const viewTop = v.rel + v.stickyTop;
    const viewBottom = v.rel + v.viewportSize;

    // Already fully in view (and clear of the header) → leave scroll untouched.
    if (itemTop >= viewTop && itemBottom <= viewBottom) return;

    // Off-screen → bring it to the nearest edge, just below the sticky header.
    v.handle.scrollToIndex(selectedIndex, {
      align: 'nearest',
      offset: -v.stickyTop,
    });
  }, [selectedIndex, listRelativeViewport]);

  const onScroll = useCallback(() => {
    const v = listRelativeViewport();
    if (!v) return;
    const lastIndex = page.items.length - 1;
    if (lastIndex < 0) return;

    if (page.previous && v.rel < EXTEND_THRESHOLD_PX) {
      extendBackward();
    }

    const totalSize =
      v.handle.getItemOffset(lastIndex) + v.handle.getItemSize(lastIndex);
    const distanceToEnd = totalSize - (v.rel + v.viewportSize);
    if (page.next && distanceToEnd < EXTEND_THRESHOLD_PX) {
      extendForward();
    }
  }, [
    page.previous,
    page.next,
    page.items.length,
    extendBackward,
    extendForward,
    listRelativeViewport,
  ]);

  return (
    <div
      className={styles.journalpostList}
      style={{ '--jp-number-col': numberColWidth } as React.CSSProperties}
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

      <div ref={listRef} className={styles.list}>
        <WindowVirtualizer
          ref={vlistRef}
          shift={shift}
          ssrCount={page.items.length}
          itemSize={120}
          onScroll={onScroll}
        >
          {page.items.map((j) => {
            const selected = journalpostKey(j) === optimisticSelectedKey;
            return (
              <JournalpostListItem
                key={j.id}
                journalpost={j}
                openHref={journalpostHref(j)}
                closeHref={saksmappeHref}
                ownerEnhetName={ownerEnhetName}
                selected={selected}
                languageCode={languageCode}
                detail={selected ? selectedDetail : null}
              />
            );
          })}
        </WindowVirtualizer>
      </div>
    </div>
  );
}

function JournalpostListItem({
  journalpost,
  openHref,
  closeHref,
  ownerEnhetName,
  selected,
  languageCode,
  detail,
}: {
  journalpost: Journalpost;
  openHref: string;
  closeHref: string;
  ownerEnhetName: string;
  selected: boolean;
  languageCode: ReturnType<typeof useLanguageCode>;
  detail: React.ReactNode;
}) {
  const t = useTranslation();
  const kind = journalpostKind(journalpost.journalposttype);
  const attachmentCount = (journalpost.dokumentbeskrivelse ?? []).length;

  // The detail face stays mounted always (empty until first opened), so its
  // opacity can transition 0 → 1 on open — a face mounted fresh at opacity 1
  // would pop in with no fade. The `detail` prop drops to null the instant the
  // row deselects (close/switch), so cache the last non-null detail (React
  // elements are immutable, cheap to re-render) to keep showing it while it
  // fades back out.
  const lastDetailRef = useRef(detail);
  if (detail != null) lastDetailRef.current = detail;

  // Set `.bodySwap`'s height explicitly from the *active* face and let CSS
  // transition it: because the target flips the instant `selected` changes, the
  // height starts easing immediately — decoupled from the content's own quick
  // opacity crossfade. The active face stays in flow (the inactive one is an
  // absolute overlay), so `.offsetHeight` reads its natural height and the box is
  // sized right even before this measures, e.g. server-side.
  const summaryFaceRef = useRef<HTMLDivElement>(null);
  const detailFaceRef = useRef<HTMLDivElement>(null);
  const [bodyHeight, setBodyHeight] = useState<number>();
  useLayoutEffect(() => {
    const active = selected ? detailFaceRef.current : summaryFaceRef.current;
    if (!active) return;
    const measure = () => setBodyHeight(active.offsetHeight);
    measure();
    // Follow the active face's own reflow too (e.g. documents resolving).
    const ro = new ResizeObserver(measure);
    ro.observe(active);
    return () => ro.disconnect();
  }, [selected]);

  return (
    <div className={cn(styles.item, { [styles.selected]: selected })}>
      <div className={styles.itemSummary}>
        {/* Number badge: a link that opens the row when closed (one of several
            independent controls in a row), a plain indicator when open. */}
        {selected ? (
          <span className={styles.itemNumber}>
            <span className={styles.numberBadge}>
              {journalpost.journalpostnummer}
            </span>
          </span>
        ) : (
          <EinLink
            href={openHref}
            className={styles.itemNumber}
            aria-label={`${t('journalpost.label')} ${journalpost.journalpostnummer}`}
          >
            <span className={styles.numberBadge}>
              {journalpost.journalpostnummer}
            </span>
          </EinLink>
        )}
        <div className={styles.itemBody}>
          {/* The closed and open states are two crossfading faces. Each carries
              its OWN title, so the whole content — title included — fades out/in
              (the title isn't morphed; it crossfades small→large). The active
              face is in flow and sets the eased box height; the inactive one is
              an absolute overlay, faded out. Both show the same data, so they
              never read as duplicated. */}
          <div
            className={styles.bodySwap}
            style={
              bodyHeight != null ? { height: `${bodyHeight}px` } : undefined
            }
          >
            <div
              ref={summaryFaceRef}
              className={cn(styles.face, styles.summaryFace)}
              inert={selected || undefined}
            >
              {/* Closed title: its text is a link that opens the row. */}
              <h3 className={styles.itemTitle}>
                <EinLink href={openHref}>{journalpost.offentligTittel}</EinLink>
              </h3>
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
              <div className={styles.itemFooter}>
                {attachmentCount > 0 && (
                  <span className={styles.attachmentBadge}>
                    <PaperclipIcon
                      aria-hidden="true"
                      className={styles.attachmentIcon}
                    />
                    <span>
                      {t(
                        'journalpost.attachmentCount',
                        String(attachmentCount),
                      )}
                    </span>
                  </span>
                )}
              </div>
            </div>

            {/* Always mounted (empty until first opened) so its opacity can
                transition in on open. */}
            <div
              ref={detailFaceRef}
              className={cn(styles.face, styles.detailFace)}
              inert={!selected || undefined}
            >
              {/* Open title: a plain heading (the top-right close button
                  collapses the row). */}
              <h3 className={styles.itemTitle}>
                {journalpost.offentligTittel}
              </h3>
              {selected ? detail : lastDetailRef.current}
            </div>
          </div>
        </div>

        {/* Explicit close (top-right) when the row is open — the title itself is
            no longer a link. */}
        {selected && (
          <EinLink
            href={closeHref}
            className={cn(styles.iconButton, styles.closeAction)}
            aria-label={t('common.close')}
          >
            <XMarkIcon aria-hidden="true" />
          </EinLink>
        )}
      </div>
    </div>
  );
}
