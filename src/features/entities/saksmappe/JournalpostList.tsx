'use client';

import {
  isEnhet,
  type Journalpost,
  type PaginatedList,
  type Saksmappe,
} from '@digdir/einnsyn-sdk';
import { PaperclipIcon, XMarkIcon } from '@navikt/aksel-icons';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { WindowVirtualizer, type WindowVirtualizerHandle } from 'virtua';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinLink } from '~/components/EinLink/EinLink';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import JournalpostContainer from '~/features/entities/journalpost/JournalpostContainer';
import JournalpostContainerSkeleton from '~/features/entities/journalpost/JournalpostContainerSkeleton';
import { Korrespondansepart } from '~/features/entities/journalpost/Korrespondansepart';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { setTopBoundaryProvisional } from '~/hooks/useScrollState';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { dateFormat } from '~/lib/utils/dateFormat';
import {
  fetchNextPage,
  fetchPreviousPage,
  mergeWindow,
} from '~/lib/utils/pagination';
import styles from './JournalpostList.module.scss';
import { JOURNALPOST_LIST_HEADING_ID } from './SaksmappeHeader';

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

  // While earlier journalposts remain unloaded above the window, scroll offset 0
  // is the top of the *loaded* slice, not the real top — tell the scroll system
  // so the site header doesn't briefly snap to its at-top pose when the user
  // reaches it and then bounce back as the prepended page pushes the page down.
  // Cleared on unmount so leaving this list doesn't pin the header.
  useEffect(() => {
    setTopBoundaryProvisional(!!page.previous);
  }, [page.previous]);
  useEffect(() => () => setTopBoundaryProvisional(false), []);

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
  //
  // Gate on the *selection key*, not the index: a deep-link landing or opening
  // another row changes the key, but paging earlier posts in above the open row
  // only shifts its index (the key is unchanged). Re-running on that shift would
  // treat the now-off-screen active row as needing a scroll and yank the page
  // back down — undoing the upward scroll that triggered the page-extend.
  const scrolledForKeyRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (optimisticSelectedKey === scrolledForKeyRef.current) return;

    // Selection cleared (row closed): record it so reopening can scroll again,
    // then stop — there's nothing to bring into view.
    if (selectedIndex < 0) {
      if (!optimisticSelectedKey) scrolledForKeyRef.current = undefined;
      return;
    }

    const v = listRelativeViewport();
    if (!v) return;

    // The new selection is resolved and measurable; mark it handled so a later
    // index shift (paging) doesn't re-trigger the scroll.
    scrolledForKeyRef.current = optimisticSelectedKey;

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
  }, [optimisticSelectedKey, selectedIndex, listRelativeViewport]);

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
    // A labelled region for the list. Its heading ("Journalposter i saka") lives
    // in the sticky header (SaksmappeHeader), not above the list, so it isn't
    // shown twice; aria-labelledby points across the landmark boundary at that
    // heading's id to keep the list programmatically named.
    <section
      className={styles.journalpostList}
      style={{ '--jp-number-col': numberColWidth } as React.CSSProperties}
      aria-labelledby={JOURNALPOST_LIST_HEADING_ID}
    >
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
                anyRowSelected={!!optimisticSelectedKey}
                languageCode={languageCode}
                detail={selected ? selectedDetail : null}
              />
            );
          })}
        </WindowVirtualizer>
      </div>
    </section>
  );
}

function JournalpostListItem({
  journalpost,
  openHref,
  closeHref,
  ownerEnhetName,
  selected,
  anyRowSelected,
  languageCode,
  detail,
}: {
  journalpost: Journalpost;
  openHref: string;
  closeHref: string;
  ownerEnhetName: string;
  selected: boolean;
  // Whether *any* row is currently open. Lets a closing row tell a genuine
  // close (return focus to its trigger) from a direct switch to another row
  // (that row claims focus instead).
  anyRowSelected: boolean;
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

  // Move focus when the row toggles. Opening swaps the badge/title links for
  // static text and closing unmounts the close button, so the focused element
  // disappears mid-interaction — without this, focus falls back to <body> and
  // keyboard / screen-reader users lose their place and get no cue that the
  // detail appeared.
  //   - Opened  → focus the detail heading, so the expanded content is what's
  //     announced and Tab continues into it.
  //   - Closed  → return focus to this row's title link (the trigger), the
  //     dialog-style "restore focus on dismiss" pattern — but only on a genuine
  //     close. On a direct switch to another row `anyRowSelected` is still true,
  //     so the newly opened row takes focus instead and we stay out of its way.
  // Compare against the previous value (not a mount flag) so an initial,
  // deep-linked open doesn't steal focus on page load. `preventScroll` leaves
  // scrolling to the list's own keep-in-view effect.
  const titleLinkRef = useRef<HTMLAnchorElement>(null);
  const detailHeadingRef = useRef<HTMLHeadingElement>(null);
  const prevSelectedRef = useRef(selected);
  useEffect(() => {
    const wasSelected = prevSelectedRef.current;
    prevSelectedRef.current = selected;
    if (wasSelected === selected) return;
    if (selected) {
      detailHeadingRef.current?.focus({ preventScroll: true });
    } else if (!anyRowSelected) {
      titleLinkRef.current?.focus({ preventScroll: true });
    }
  }, [selected, anyRowSelected]);

  return (
    <div className={cn(styles.item, { [styles.selected]: selected })}>
      <div className={styles.itemSummary}>
        {/* Number badge: a non-interactive identifier in both states. It used to
            also be an open-the-row link when closed, but that duplicated the
            title link (same href) as a second, less descriptive tab stop — the
            title is the row's single link now. On open it slides down to track
            the title's first-line centre as the title grows. */}
        <span className={styles.itemNumber}>
          <span className={styles.numberBadge}>
            {journalpost.journalpostnummer}
          </span>
        </span>
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
              {/* Closed title: its text is a link that opens the row. Focus
                  returns here when the row is closed. */}
              <h3 className={styles.itemTitle}>
                <EinLink ref={titleLinkRef} href={openHref}>
                  {journalpost.offentligTittel}
                </EinLink>
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
                  collapses the row). `tabIndex={-1}` makes it a programmatic
                  focus target on open — not reachable by Tab. */}
              <h3
                ref={detailHeadingRef}
                tabIndex={-1}
                className={styles.itemTitle}
              >
                {journalpost.offentligTittel}
              </h3>
              {selected ? detail : lastDetailRef.current}
            </div>
          </div>
        </div>

        {/* Right-aligned actions, present in both states so they don't reflow
            on open. The order-access button sits below a fixed-height slot that
            reserves the top-right corner for the open-row close button — so the
            button holds the exact same position whether the row is open or
            closed; the close button just fills the reserved corner above it when
            open. `data-size="sm"` keeps the button list-sized. */}
        <div className={styles.itemActions} data-size="sm">
          <div className={styles.actionsTop}>
            {selected && (
              <EinLink
                href={closeHref}
                className={styles.iconButton}
                aria-label={t('common.close')}
              >
                <XMarkIcon aria-hidden="true" />
              </EinLink>
            )}
          </div>
          {/* TODO: wire up the "order access" flow. Secondary in the closed
              list; the prominent primary CTA once the row is open. */}
          <EinButton
            type="button"
            variant={selected ? 'primary' : 'secondary'}
            className={styles.orderAccessButton}
          >
            {t('journalpost.orderAccess')}
            {/* Every row's button would otherwise carry the identical accessible
                name, so a screen reader's button list shows N indistinguishable
                entries. The row title disambiguates it. `.ds-sr-only` is
                absolutely positioned, so it's out of the button's flex flow and
                doesn't change its width. */}
            <span className="ds-sr-only">{journalpost.offentligTittel}</span>
          </EinButton>
        </div>
      </div>
    </div>
  );
}
