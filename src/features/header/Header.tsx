'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { EinLink } from '~/components/EinLink/EinLink';
import {
  EinTransition,
  type EinTransitionEvents,
} from '~/components/EinTransition/EinTransition';
import { EnhetProvider } from '~/components/EnhetProvider/EnhetProvider';
import Logo from '~/components/Logo';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import { SearchField } from '~/components/SearchField/SearchField';
import { useScrollState } from '~/hooks/useScrollState';
import type { TrimmedEnhet } from '~/lib/enhet/enhet';
import { resolvePath } from '~/lib/routing/pathname';
import { showsSearchField, showsSearchResults } from '~/lib/routing/sections';
import { animationFrame } from '~/lib/utils/animationFrame';
import cn from '~/lib/utils/className';
import { EASE_IN_OUT_QUART, EASE_OUT_QUART } from '~/lib/utils/cssConstants';
import { domFreeze } from '~/lib/utils/domFreeze';
import { domTransitionend } from '~/lib/utils/domTransitionend';
import UserMenu from './components/UserMenu';
import styles from './Header.module.scss';

// The header's own UI: sticky, collapsing as you scroll down, and morphing
// between the landing page's hero and the inner-page bar. A client component,
// so `HeaderWithEnhets` fetches what it needs and passes it in.
export default function Header({
  children,
  initialEnhets,
}: {
  // The header's second row: search tabs, a breadcrumb trail, admin tabs. The
  // search field is not part of this — it lives here so it survives navigation.
  children: React.ReactNode;
  initialEnhets?: readonly TrimmedEnhet[];
}) {
  const { loading, optimisticPathname } = useNavigation();
  // Which second row the page gets: one per root folder, and below an enhet one
  // per case or meeting folder. In folder names, so `/oslo/case/abc` and
  // `/oslo/sak/abc` are both `saksmappe`.
  const [folder = '', subfolder] = resolvePath(optimisticPathname);
  const section = folder === '[enhet]' ? (subfolder ?? folder) : folder;
  const isHome = section === '';
  const hasSearchField = showsSearchField(optimisticPathname);

  const [headerHeight, setHeaderHeight] = useState<number | null>(null);
  const [flowHeight, setFlowHeight] = useState<number | null>(null);
  const { isAtTop, isScrollingDown } = useScrollState();

  // The header itself; its wrapper is the sticky element.
  const headerRef = useRef<HTMLElement>(null);

  // Keep the in-flow header height measured, so the wrapper can hold it as soon
  // as the header sticks, without waiting for a second pass.
  useLayoutEffect(() => {
    if (isHome) {
      setHeaderHeight(null);
      return;
    }

    const headerElement = headerRef.current;
    if (!headerElement) {
      return;
    }

    const updateHeaderHeight = () => {
      const nextHeight = headerElement.offsetHeight;
      setHeaderHeight((currentHeight) =>
        currentHeight === nextHeight ? currentHeight : nextHeight,
      );
    };

    updateHeaderHeight();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateHeaderHeight);
      window.visualViewport?.addEventListener('resize', updateHeaderHeight);

      return () => {
        window.removeEventListener('resize', updateHeaderHeight);
        window.visualViewport?.removeEventListener(
          'resize',
          updateHeaderHeight,
        );
      };
    }

    const resizeObserver = new ResizeObserver(updateHeaderHeight);
    resizeObserver.observe(headerElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isHome]);

  useLayoutEffect(() => {
    if (headerHeight === null) return;
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty('--ein-header-height', `${headerHeight}px`);
    return () => {
      rootStyle.removeProperty('--ein-header-height');
    };
  }, [headerHeight]);

  const isStuck = !isHome && !isAtTop && headerHeight !== null;

  // Measured only at the top. While stuck, the wrapper holds this height so the
  // header collapsing doesn't reflow the page (see `.sticky`).
  if (flowHeight !== headerHeight && (!isStuck || flowHeight === null)) {
    setFlowHeight(headerHeight);
  }

  const headerClassName = cn(styles.header, {
    'section-home': isHome,
    [styles.scrolled]: !isHome && isScrollingDown,
    [styles.stuck]: isStuck,
  });

  // Only the home <-> inner morph runs here. Every other route change leaves
  // the header's own layout alone — the field is persistent and the second row
  // has its own transition below — so the dependency deliberately does not
  // include the section, which would snapshot and replace an element that would
  // otherwise just update in place.
  const headerTransitionDeps = [isHome ? 'home' : 'inner'];
  // The second row swaps when the row it shows does: search tabs, breadcrumb,
  // admin tabs. Every section with search results shows the search tabs (the
  // landing page hides them), so moving among those is not a change.
  const secondRowTransitionDeps = [
    showsSearchResults(optimisticPathname) ? 'search' : section,
  ];
  // Flies a frozen copy of the incoming header from the outgoing one's place to
  // its own layout. Reads nothing from render: EinTransition re-runs its current
  // step whenever the events object changes.
  const headerTransitionEvents = useMemo<
    EinTransitionEvents<typeof headerTransitionDeps>
  >(
    () => ({
      onInitTransition: async (snapshot) => {
        const outgoingHeader = snapshot.querySelector('header');
        const liveHeader = headerRef.current;
        if (!outgoingHeader || !liveHeader) {
          return;
        }

        const fromHeaderRect = outgoingHeader.getBoundingClientRect();
        const fromFormRect = outgoingHeader
          .querySelector('form')
          ?.getBoundingClientRect();
        const fromSnapshotHeight = snapshot.getBoundingClientRect().height;

        // Replace the frozen outgoing header with a frozen incoming one, so
        // it has the new content.
        const incomingHeader = domFreeze(liveHeader);
        outgoingHeader.replaceWith(incomingHeader);

        // A row on its way out belongs to the second row's own transition.
        for (const rowSnapshot of incomingHeader.querySelectorAll<HTMLElement>(
          '.header-second-row[inert]',
        )) {
          rowSnapshot.style.visibility = 'hidden';
        }
        const form = incomingHeader.querySelector('form');
        const row = incomingHeader.querySelector<HTMLElement>(
          '.header-second-row:not([inert])',
        );
        const toHeaderRect = incomingHeader.getBoundingClientRect();
        const toFormRect = form?.getBoundingClientRect();
        // No height on the landing page, or while its own transition loads it.
        const measuredRowRect = row?.getBoundingClientRect();
        const toRowRect = measuredRowRect?.height ? measuredRowRect : undefined;
        // The row hangs under the field, as in its own layout.
        const fromRowRect =
          toRowRect && fromFormRect && toFormRect
            ? new DOMRect(
                fromFormRect.x + toRowRect.x - toFormRect.x,
                fromFormRect.y + toRowRect.y - toFormRect.y,
                fromFormRect.width + toRowRect.width - toFormRect.width,
                toRowRect.height,
              )
            : undefined;

        // Posed at the outgoing geometry. The snapshot too, for this commit:
        // the page transition pins the outgoing page where it finds it.
        snapshot.style.height = `${fromSnapshotHeight}px`;
        Object.assign(incomingHeader.style, {
          position: 'fixed',
          top: `${fromHeaderRect.top}px`,
          left: `${fromHeaderRect.left}px`,
          width: `${fromHeaderRect.width}px`,
          height: `${fromHeaderRect.height}px`,
          overflow: 'hidden',
        });
        if (form && fromFormRect) {
          // Drawn over the row, as in the live header.
          Object.assign(form.style, {
            position: 'absolute',
            margin: '0',
            zIndex: '1',
          });
          place(form, fromFormRect, fromHeaderRect);
        }
        if (row && fromRowRect) {
          Object.assign(row.style, { position: 'absolute', opacity: '0' });
          place(row, fromRowRect, fromHeaderRect);
        }

        await animationFrame(1);

        // The incoming page is still hidden, so it can take its place at once
        // and only fade in, while the header moves over it.
        snapshot.style.height = `${toHeaderRect.height}px`;

        // A slow start both ways: going home, the results fade out in place
        // before the growing header reaches them.
        const morphTransition = (...properties: string[]) =>
          properties
            .map((property) => `${property} 400ms ${EASE_IN_OUT_QUART}`)
            .join(', ');
        incomingHeader.style.transition = morphTransition('height');
        incomingHeader.style.height = `${toHeaderRect.height}px`;
        if (form && fromFormRect && toFormRect) {
          form.style.transition = morphTransition(
            'top',
            'left',
            'width',
            'max-width',
          );
          place(form, toFormRect, toHeaderRect);
        }
        // Moves with the field, and fades in once the field has slowed down.
        if (row && fromRowRect && toRowRect) {
          row.style.transition = [
            morphTransition('top', 'left', 'width', 'max-width'),
            `opacity 200ms ${EASE_OUT_QUART} 250ms`,
          ].join(', ');
          place(row, toRowRect, toHeaderRect);
          row.style.opacity = '1';
        }

        await domTransitionend(incomingHeader);
      },
    }),
    [],
  );

  return (
    <EinTransition
      dependencies={headerTransitionDeps}
      events={headerTransitionEvents}
    >
      <div
        className={cn({ [styles.sticky]: !isHome })}
        style={
          isStuck && flowHeight !== null
            ? { height: `${flowHeight}px` }
            : undefined
        }
      >
        <header ref={headerRef} className={headerClassName}>
          <div className={cn(styles.containerWrapper, 'container-wrapper')}>
            <div
              className={cn(
                styles.containerPre,
                'container-pre',
                'collapsible',
              )}
            >
              <EinLink className={cn(styles.logoLink, 'logo-link')} href="/">
                <Logo />
              </EinLink>
            </div>
            <div className={cn(styles.container, 'container')}>
              {hasSearchField && (
                <EnhetProvider initialEnhets={initialEnhets}>
                  <SearchField className={styles.searchForm} />
                </EnhetProvider>
              )}

              {/* The second row is the only part that changes between routes,
                  so it is what gets snapshotted and swapped. EinTransition
                  holds the outgoing row on screen through `waitForLoad` — the
                  breadcrumb needs a server fetch — and poses the incoming one
                  before revealing it. `withClassNames` means the motion itself
                  is CSS; nothing here measures anything. */}
              <EinTransition
                dependencies={secondRowTransitionDeps}
                loading={loading}
                withClassNames
              >
                <div
                  className={cn(styles.secondRow, 'header-second-row')}
                  data-size="sm"
                >
                  {children}
                </div>
              </EinTransition>
            </div>
            <div className={cn(styles.containerPost, 'container-post')}>
              <div className={styles.headerDropdownList}>
                <UserMenu />
              </div>
            </div>
          </div>
        </header>
      </div>
    </EinTransition>
  );
}

// Places an absolutely positioned element at `rect` within `containerRect`.
function place(element: HTMLElement, rect: DOMRect, containerRect: DOMRect) {
  element.style.top = `${rect.top - containerRect.top}px`;
  element.style.left = `${rect.left - containerRect.left}px`;
  element.style.width = `${rect.width}px`;
  element.style.maxWidth = `${rect.width}px`;
}
