'use client';

import {
  isEnhet,
  type Journalpost,
  type PaginatedList,
  type Saksmappe,
} from '@digdir/einnsyn-sdk';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PaperclipIcon,
  SortDownIcon,
  XMarkIcon,
} from '@navikt/aksel-icons';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Virtualizer, type VirtualizerHandle } from 'virtua';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinLink } from '~/components/EinLink/EinLink';
import {
  EinTransition,
  type EinTransitionEvents,
} from '~/components/EinTransition/EinTransition';
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

  // Drive the visible detail pane from the optimistic pathname so the
  // open/close animation can begin the instant the user clicks a link,
  // before the server route has resolved.
  const optimisticSelectedKey = useMemo(() => {
    const match = optimisticPathname.match(/\/journalpost\/([^/?#]+)/);
    return match?.[1];
  }, [optimisticPathname]);

  // The journalpost being navigated to, resolved from the list payload we
  // already hold in memory. Lets the detail pane render real metadata
  // immediately and skeleton only the documents — the one part that needs the
  // heavier detail expand (`dokumentbeskrivelse.dokumentobjekt`).
  const optimisticJournalpost = useMemo(() => {
    if (!optimisticSelectedKey) return undefined;
    return page.items.find((j) => journalpostKey(j) === optimisticSelectedKey);
  }, [page.items, optimisticSelectedKey]);

  // Build every in-view link from the saksmappe identifier exactly as it
  // appears in the current URL. If the close/prev/next links used a different
  // identifier than the journalpost links (e.g. slug vs id — the embedded
  // `journalpost.saksmappe` often lacks a slug), opening/closing would change
  // the `[saksmappe]` route param and remount the whole subtree, canceling the
  // detail-pane transition.
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

  // Drive the active row, its highlight and the prev/next arrows from the
  // optimistic key so they stay in agreement with the detail pane during the
  // loading window — the pane already shows the optimistic target, so the row
  // and arrows must point at it too (and a second "next" advances correctly).
  const selectedIndex = useMemo(() => {
    if (!optimisticSelectedKey) return -1;
    return page.items.findIndex(
      (j) => journalpostKey(j) === optimisticSelectedKey,
    );
  }, [page.items, optimisticSelectedKey]);

  // Size the number column to fit the widest journalpostnummer in the loaded
  // window. The number renders inside `.numberBadge` (a bordered pill), so the
  // cell width is the badge — `max(--jp-badge-size, digits + badge padding +
  // border)` — plus the cell's own horizontal padding. Mirrors the badge's
  // own min-width so the column var matches the rendered cell width and the
  // detail pane's left edge stays aligned with `.itemBody`.
  const numberColWidth = useMemo(() => {
    let maxChars = 1;
    for (const j of page.items) {
      const n = j.journalpostnummer;
      if (n == null) continue;
      const len = String(n).length;
      if (len > maxChars) maxChars = len;
    }
    // Only ever grow: a page-extend that drops the widest number shouldn't
    // reflow the rail and pane narrower mid-scroll.
    maxChars = Math.max(maxChars, maxNumberCharsRef.current);
    maxNumberCharsRef.current = maxChars;
    return `calc(max(var(--jp-badge-size), ${maxChars}ch + var(--jp-badge-pad) * 2 + var(--ds-border-width-default) * 2) + var(--ds-size-2) * 2)`;
  }, [page.items]);

  const optimisticIsSplit = !!optimisticSelectedKey;
  // `children` is rendered by the *current* (non-optimistic) route, so it
  // mismatches the target while a navigation is in flight. Render the partial
  // detail (real metadata, skeleton documents) in that window.
  const isContentLoading = optimisticSelectedKey !== selectedKey;
  const prev = selectedIndex > 0 ? page.items[selectedIndex - 1] : undefined;
  const next =
    selectedIndex >= 0 && selectedIndex < page.items.length - 1
      ? page.items[selectedIndex + 1]
      : undefined;

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
    />
  ) : (
    <JournalpostContainerSkeleton />
  );

  // Direction-aware slide for switching the open journalpost while the pane
  // stays open. Everything travels in the browse direction: selecting an
  // earlier post (or browsing up) slides the old content up and out while the
  // new content slides up into view; a later post slides everything down. The
  // sign is read by CSS from `--slide-dir` (−1 up, +1 down, 0 = plain fade when
  // the direction is unknown). Deps carry [key, index]; the index gives us the
  // direction by comparing the previous and next selection.
  const switchEvents = useMemo<
    EinTransitionEvents<[string | undefined, number]>
  >(() => {
    const setDirection = (
      element: HTMLElement,
      toDeps: [string | undefined, number],
      fromDeps: [string | undefined, number] | undefined,
    ) => {
      const to = toDeps[1];
      const from = fromDeps?.[1];
      const dir =
        from == null || from < 0 || to < 0 || to === from
          ? 0
          : to > from
            ? 1
            : -1;
      element.style.setProperty('--slide-dir', String(dir));
    };
    return {
      onInitExitTransition: setDirection,
      onInitEnterTransition: setDirection,
    };
  }, []);

  const vlistRef = useRef<VirtualizerHandle>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // `--jp-full-w` = the list's full width (so split rows can be pinned to it and
  // never reflow during the crimp); `--jp-sticky-top` = the sticky global-header
  // height the list pins below. useLayoutEffect so the values are set before
  // paint (a deep link renders split immediately). Re-measured on layout change.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const body = bodyRef.current;
    if (!root || !body) return;
    const globalHeader = document.querySelector('header');
    const update = () => {
      root.style.setProperty('--jp-full-w', `${body.clientWidth}px`);
      const stickyTop = globalHeader?.getBoundingClientRect().height ?? 0;
      root.style.setProperty('--jp-sticky-top', `${stickyTop}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(body);
    if (globalHeader) ro.observe(globalHeader);
    return () => ro.disconnect();
  }, []);

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

  // Keep the selected item visible, but only nudge the scroll region when it's
  // actually off-screen — an already-visible item (the common case when opening
  // or browsing prev/next) stays exactly where it is.
  useEffect(() => {
    if (selectedIndex < 0) return;
    const handle = vlistRef.current;
    if (!handle) return;

    const itemTop = handle.getItemOffset(selectedIndex);
    const itemBottom = itemTop + handle.getItemSize(selectedIndex);
    const viewTop = handle.scrollOffset;
    const viewBottom = viewTop + handle.viewportSize;

    // Already fully in view → leave the scroll position untouched.
    if (itemTop >= viewTop && itemBottom <= viewBottom) return;

    // Off-screen → scroll the minimum needed to bring it to the nearest edge.
    handle.scrollToIndex(selectedIndex, { align: 'nearest' });
  }, [selectedIndex]);

  const onScroll = useCallback(() => {
    const handle = vlistRef.current;
    if (!handle) return;
    const lastIndex = page.items.length - 1;
    if (lastIndex < 0) return;

    const offset = handle.scrollOffset;
    if (page.previous && offset < EXTEND_THRESHOLD_PX) {
      extendBackward();
    }

    const totalSize =
      handle.getItemOffset(lastIndex) + handle.getItemSize(lastIndex);
    const distanceToEnd = totalSize - (offset + handle.viewportSize);
    if (page.next && distanceToEnd < EXTEND_THRESHOLD_PX) {
      extendForward();
    }
  }, [
    page.previous,
    page.next,
    page.items.length,
    extendBackward,
    extendForward,
  ]);

  return (
    <div
      ref={rootRef}
      className={cn(styles.journalpostList, {
        [styles.split]: optimisticIsSplit,
      })}
      style={{ '--jp-number-col': numberColWidth } as React.CSSProperties}
    >
      <div className={styles.listHeader}>
        <div className={styles.titleGroup}>
          <h2 className={styles.title}>{t('journalpost.labelPluralInCase')}</h2>
        </div>
        <div className={styles.toolbar} inert={optimisticIsSplit || undefined}>
          <button
            type="button"
            className={styles.iconButton}
            aria-label={t('searchFilters.sorting')}
          >
            <SortDownIcon aria-hidden="true" />
          </button>
        </div>
      </div>

      <div ref={bodyRef} className={styles.body}>
        <div ref={listRef} className={styles.list}>
          <Virtualizer
            ref={vlistRef}
            scrollRef={listRef}
            shift={shift}
            ssrCount={page.items.length}
            itemSize={120}
            onScroll={onScroll}
          >
            {page.items.map((j) => (
              <JournalpostListItem
                key={j.id}
                journalpost={j}
                href={journalpostHref(j)}
                ownerEnhetName={ownerEnhetName}
                selected={journalpostKey(j) === optimisticSelectedKey}
                languageCode={languageCode}
              />
            ))}
          </Virtualizer>
        </div>

        <div className={styles.detailSlot}>
          <EinTransition dependencies={[optimisticIsSplit]} withClassNames>
            {optimisticIsSplit ? (
              <section
                className={styles.detailPane}
                aria-label={t('journalpost.label')}
              >
                <header className={styles.detailHeader}>
                  <div className={styles.detailNav}>
                    {optimisticJournalpost?.journalpostnummer != null && (
                      <span className={styles.detailNumber}>
                        {t(
                          'journalpost.numberLabel',
                          String(optimisticJournalpost.journalpostnummer),
                        )}
                      </span>
                    )}
                    <DetailNavButton
                      target={prev}
                      href={prev ? journalpostHref(prev) : ''}
                      label={t('journalpost.previous')}
                    >
                      <ChevronUpIcon aria-hidden="true" />
                    </DetailNavButton>
                    <DetailNavButton
                      target={next}
                      href={next ? journalpostHref(next) : ''}
                      label={t('journalpost.next')}
                    >
                      <ChevronDownIcon aria-hidden="true" />
                    </DetailNavButton>
                  </div>
                  <div className={styles.detailActions}>
                    <EinButton
                      asChild
                      variant="tertiary"
                      icon
                      aria-label={t('common.close')}
                    >
                      <EinLink href={saksmappeHref} unstyled>
                        <XMarkIcon aria-hidden="true" />
                      </EinLink>
                    </EinButton>
                  </div>
                </header>
                <div className={styles.detailBody}>
                  <EinTransition<[string | undefined, number]>
                    dependencies={[optimisticSelectedKey, selectedIndex]}
                    withClassNames
                    events={switchEvents}
                  >
                    <div className={styles.detailContent}>
                      {isContentLoading || !children ? loadingDetail : children}
                    </div>
                  </EinTransition>
                </div>
              </section>
            ) : null}
          </EinTransition>
        </div>
      </div>
    </div>
  );
}

// Prev/next browse control. When there's a target it's a real navigation, so
// render a Designsystemet tertiary icon button as a link (EinLink, unstyled so
// the link rules don't fight the button box); at the ends of the list there's
// nothing to go to, so render a genuinely disabled button instead.
function DetailNavButton({
  target,
  href,
  label,
  children,
}: {
  target: Journalpost | undefined;
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  if (!target) {
    return (
      <EinButton variant="tertiary" icon disabled aria-label={label}>
        {children}
      </EinButton>
    );
  }
  return (
    <EinButton asChild variant="tertiary" icon aria-label={label}>
      <EinLink href={href} unstyled>
        {children}
      </EinLink>
    </EinButton>
  );
}

function JournalpostListItem({
  journalpost,
  href,
  ownerEnhetName,
  selected,
  languageCode,
}: {
  journalpost: Journalpost;
  href: string;
  ownerEnhetName: string;
  selected: boolean;
  languageCode: ReturnType<typeof useLanguageCode>;
}) {
  const t = useTranslation();
  const url = href;
  const kind = journalpostKind(journalpost.journalposttype);

  const attachmentCount = (journalpost.dokumentbeskrivelse ?? []).length;
  // .filter((d) => typeof d !== 'string')
  // .filter((d) => d.tilknyttetRegistreringSom.endsWith('vedlegg')).length;

  return (
    <div className={cn(styles.item, { [styles.selected]: selected })}>
      <EinLink
        href={url}
        className={styles.itemNumber}
        aria-label={`${t('journalpost.label')} ${journalpost.journalpostnummer}`}
      >
        <span className={styles.numberBadge}>
          {journalpost.journalpostnummer}
        </span>
      </EinLink>
      <div className={styles.itemBody}>
        <EinLink href={url} className={styles.itemTitle}>
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
        <div className={styles.itemFooter}>
          {attachmentCount > 0 && (
            <span className={styles.attachmentBadge}>
              <PaperclipIcon
                aria-hidden="true"
                className={styles.attachmentIcon}
              />
              <span>
                {t('journalpost.attachmentCount', String(attachmentCount))}
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
