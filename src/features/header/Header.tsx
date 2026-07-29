'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { EinLink } from '~/components/EinLink/EinLink';
import {
  EinTransition,
  type EinTransitionEvents,
} from '~/components/EinTransition/EinTransition';
import Logo from '~/components/Logo';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import { useScrollState } from '~/hooks/useScrollState';
import { animationFrame } from '~/lib/utils/animationFrame';
import cn from '~/lib/utils/className';
import { EASE_IN_OUT_QUART, EASE_OUT_QUART } from '~/lib/utils/cssConstants';
import { domTransitionend } from '~/lib/utils/domTransitionend';
import UserMenu from './components/UserMenu';
import styles from './Header.module.scss';
import { useHeaderCollapse } from './useHeaderCollapse';
import { useHeaderCollapseDistance, useHeaderTwoLevel } from './useHeaderMode';

export default function Header({ children }: { children: React.ReactNode }) {
  const { loading, optimisticPathname } = useNavigation();
  const [rootPath = 'home'] = optimisticPathname.split('/').filter(Boolean);
  const isHome = rootPath === 'home';

  const [headerHeight, setHeaderHeight] = useState<number | null>(null);
  // The header's height in its EXPANDED pose. The fixed spacer reserves against
  // this STABLE value (not the live collapsing height) so a minimize/expand never
  // changes in-flow geometry — which would reflow the document, trip scroll
  // anchoring, and feed the scroll-direction detector, oscillating the header
  // (the compact/expanded flicker).
  const [expandedHeaderHeight, setExpandedHeaderHeight] = useState<
    number | null
  >(null);
  const [fixedViewportWidth, setFixedViewportWidth] = useState<number | null>(
    null,
  );
  const [fixedViewportTop, setFixedViewportTop] = useState(0);
  const [fixedViewportLeft, setFixedViewportLeft] = useState(0);
  const { isAtTop, isScrollingDown } = useScrollState();
  // The saksmappe / journalpost page opts into the scroll-linked collapse; other
  // pages keep the collapse-on-scroll-down / expand-on-scroll-up behaviour.
  const twoLevel = useHeaderTwoLevel();
  // In two-level mode the header collapses at a scroll threshold (driven by a CSS
  // var, not the binary `minimized` class): it stays expanded until the page has
  // scrolled the collapse distance, then flips to compact in one transition.
  // SaksmappeHeader measures and publishes that distance; this hook flips the var.
  const collapseDistance = useHeaderCollapseDistance();
  useHeaderCollapse({ enabled: twoLevel && !isHome, collapseDistance });

  // ref to the actual sticky header element
  const headerRef = useRef<HTMLElement>(null);
  // Latest `minimized` / `fixed` values, readable inside the (set-up-once)
  // height observer so it only records the resting expanded height.
  const minimizedRef = useRef(false);
  const fixedRef = useRef(false);
  const previousRootPathRef = useRef(rootPath);
  const activeRouteTransitionRef = useRef<{
    fromRootPath: string;
    toRootPath: string;
  } | null>(null);

  if (previousRootPathRef.current !== rootPath) {
    activeRouteTransitionRef.current = {
      fromRootPath: previousRootPathRef.current,
      toRootPath: rootPath,
    };
    previousRootPathRef.current = rootPath;
  }

  if (!loading) {
    activeRouteTransitionRef.current = null;
  }

  const activeRouteTransition = activeRouteTransitionRef.current;
  const waitForLoad =
    loading &&
    !(
      activeRouteTransition &&
      ((activeRouteTransition.fromRootPath === 'home' &&
        activeRouteTransition.toRootPath === 'search') ||
        (activeRouteTransition.fromRootPath === 'search' &&
          activeRouteTransition.toRootPath === 'home'))
    );

  // Keep the in-flow header height measured so we can switch to fixed
  // immediately when scroll leaves the top without waiting for a second pass.
  useLayoutEffect(() => {
    if (isHome) {
      setHeaderHeight(null);
      setExpandedHeaderHeight(null);
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
      // Record the height ONLY when the header is at rest expanded — not
      // minimized and not fixed. While fixed it may be mid-collapse/expand
      // animation; capturing those transient heights would let the (frozen)
      // spacer track the animation and re-create the scroll-anchoring flicker.
      if (!minimizedRef.current && !fixedRef.current) {
        setExpandedHeaderHeight((currentHeight) =>
          currentHeight === nextHeight ? currentHeight : nextHeight,
        );
      }
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

  // Fixed-position width must track the visual viewport on mobile; `width:100%`
  // can be wider than the visible area while browser chrome is animating.
  useLayoutEffect(() => {
    if (isHome) {
      setFixedViewportWidth(null);
      setFixedViewportTop(0);
      setFixedViewportLeft(0);
      return;
    }

    const updateViewportBounds = () => {
      const viewport = window.visualViewport;
      const rawTop = viewport?.offsetTop ?? 0;
      const rawWidth = viewport?.width ?? document.documentElement.clientWidth;
      const rawLeft = viewport?.offsetLeft ?? 0;

      // visualViewport metrics carry sub-pixel jitter while scrolling (offsetTop
      // can hover around e.g. 0.5), and a plain Math.round of that flips between
      // adjacent integers (0↔1) from frame to frame. Each flip moves the fixed
      // header's `top`/`left` by a pixel AND re-renders the whole header subtree.
      // Quantize with a 1px deadband instead: keep the committed value until the
      // raw metric has moved a full pixel away from it, so jitter neither shifts
      // the header nor re-renders (the updater returns the same value and React
      // bails). Genuine viewport changes (mobile chrome, pinch-zoom) still commit.
      setFixedViewportTop((currentTop) =>
        quantizeViewportMetric(rawTop, currentTop),
      );
      setFixedViewportWidth((currentWidth) =>
        quantizeViewportMetric(rawWidth, currentWidth),
      );
      setFixedViewportLeft((currentLeft) =>
        quantizeViewportMetric(rawLeft, currentLeft),
      );
    };

    updateViewportBounds();
    window.addEventListener('resize', updateViewportBounds);
    window.visualViewport?.addEventListener('resize', updateViewportBounds);
    window.visualViewport?.addEventListener('scroll', updateViewportBounds);

    return () => {
      window.removeEventListener('resize', updateViewportBounds);
      window.visualViewport?.removeEventListener(
        'resize',
        updateViewportBounds,
      );
      window.visualViewport?.removeEventListener(
        'scroll',
        updateViewportBounds,
      );
    };
  }, [isHome]);

  const fixedHeader =
    !isHome && !isAtTop && headerHeight !== null && fixedViewportWidth !== null;
  // Expose to the height observer so it skips transient heights while fixed.
  fixedRef.current = fixedHeader;

  const fixedHeaderStyle = fixedHeader
    ? {
        top: `${fixedViewportTop}px`,
        width: `${fixedViewportWidth}px`,
        maxWidth: `${fixedViewportWidth}px`,
        left: `${fixedViewportLeft}px`,
      }
    : undefined;

  // TODO: Map rootPath from language specific URL pathname to generic pathname

  // Default mode: collapse on scroll-down, expand on scroll-up. Two-level
  // (saksmappe) mode does NOT use this binary class — it collapses via the
  // threshold-driven `--ein-header-collapse` var instead — so it stays `false`
  // and the chrome row (logo + breadcrumb) keeps its full height while the
  // SaksmappeHeader body collapses underneath it.
  const minimized = !isHome && !twoLevel && isScrollingDown;
  // Expose the latest minimized state to the (set-up-once) height observer above.
  // In two-level mode this is always false, so the observer records the
  // expanded height `E` whenever the header isn't fixed (i.e. at the top, where
  // collapse is 0) — exactly the resting expanded pose.
  minimizedRef.current = minimized;

  const className = cn(styles.header, `section-${rootPath}`, {
    [styles.scrolled]: minimized,
    [styles.fixed]: !isHome && fixedHeader && headerHeight !== null,
    // Global hook (not module-hashed) so feature components rendered into the
    // header slot can collapse via CSS in default mode.
    'header-minimized': minimized,
  });

  const transitionDeps = [rootPath];
  const transitionEvents: EinTransitionEvents<typeof transitionDeps> = useMemo(
    () => ({
      onInitTransition: async (e, [toRootPath], [fromRootPath] = []) => {
        const head = e.querySelector('header');
        if (!head) {
          return;
        }

        const form = head.querySelector('form');
        if (!form) {
          return;
        }

        // Create a clone with the new className, to measure the final position
        const targetHead = createInvisibleClone(head);
        targetHead.className = className;
        const targetStyle = getStyle(targetHead);
        const targetForm = targetHead.querySelector('form');
        if (!targetForm) {
          removeInvisibleClone(targetHead);
          return;
        }
        const currentHeadRect = head.getBoundingClientRect();
        const currentFormRect = form.getBoundingClientRect();
        const targetHeadRect = targetHead.getBoundingClientRect();
        const targetFormRect = targetForm.getBoundingClientRect();
        const targetFormOffset = getRelativeOffset(
          targetFormRect,
          targetHeadRect,
        );

        removeInvisibleClone(targetHead);

        // Transition landing page search form to header search form
        if (fromHomeToSearch(fromRootPath, toRootPath)) {
          lockElementToRect(head, currentHeadRect, currentHeadRect, {
            preserveHeight: true,
            preserveWidth: false,
            resetMargins: false,
            pinToViewport: true,
          });
          lockElementToRect(form, currentFormRect, currentHeadRect);

          await animationFrame(1);

          // Animate header container
          head.style.transition = [
            `height 400ms ${EASE_IN_OUT_QUART}`,
            `border-bottom-color 400ms ${EASE_IN_OUT_QUART}`,
            `border-bottom-width 400ms ${EASE_IN_OUT_QUART}`,
          ].join(', ');
          head.style.borderBottomColor = targetStyle['border-bottom-color'];
          head.style.borderBottomWidth = targetStyle['border-bottom-width'];
          head.style.height = `${targetHeadRect.height}px`;

          // Animate input field
          form.style.transition = [
            `top 400ms ${EASE_IN_OUT_QUART}`,
            `left 400ms ${EASE_IN_OUT_QUART}`,
            `width 400ms ${EASE_IN_OUT_QUART}`,
            `max-width 400ms ${EASE_IN_OUT_QUART}`,
          ].join(', ');
          form.style.top = `${targetFormOffset.top}px`;
          form.style.left = `${targetFormOffset.left}px`;
          form.style.width = `${targetFormRect.width}px`;
          form.style.maxWidth = `${targetFormRect.width}px`;

          await Promise.all([domTransitionend(head), domTransitionend(form)]);
        } else if (fromSearchToHome(fromRootPath, toRootPath)) {
          const headerTabs = head.querySelector('.header-tabs');
          const currentHeaderTabsRect =
            headerTabs instanceof HTMLElement
              ? headerTabs.getBoundingClientRect()
              : null;

          lockElementToRect(head, currentHeadRect, currentHeadRect, {
            preserveHeight: true,
            preserveWidth: false,
            resetMargins: false,
            pinToViewport: true,
          });
          lockElementToRect(form, currentFormRect, currentHeadRect);
          if (
            headerTabs instanceof HTMLElement &&
            currentHeaderTabsRect instanceof DOMRect
          ) {
            lockElementToRect(
              headerTabs,
              currentHeaderTabsRect,
              currentHeadRect,
            );
          }

          await animationFrame(1);

          // Animate header container
          head.style.transition = [
            `height 400ms ${EASE_OUT_QUART}`,
            `border-bottom-color 400ms ${EASE_OUT_QUART}`,
          ].join(', ');
          head.style.borderBottomColor = 'transparent';
          head.style.height = `${targetHeadRect.height}px`;

          if (headerTabs instanceof HTMLElement) {
            headerTabs.style.transition = `opacity 200ms ${EASE_OUT_QUART}`;
            headerTabs.style.opacity = '0';
          }

          // Animate input field
          form.style.transition = [
            `top 400ms ${EASE_OUT_QUART}`,
            `left 400ms ${EASE_OUT_QUART}`,
            `width 400ms ${EASE_OUT_QUART}`,
            `max-width 400ms ${EASE_OUT_QUART}`,
          ].join(', ');
          form.style.top = `${targetFormOffset.top}px`;
          form.style.left = `${targetFormOffset.left}px`;
          form.style.width = `${targetFormRect.width}px`;
          form.style.maxWidth = `${targetFormRect.width}px`;

          await Promise.all([domTransitionend(head), domTransitionend(form)]);
        }
      },
    }),
    [className],
  );

  return (
    <EinTransition
      dependencies={transitionDeps}
      loading={waitForLoad}
      events={transitionEvents}
    >
      <div>
        {/* Spacer for the fixed header. Uses the STABLE expanded height (not the
            live collapsing height) so minimizing/expanding the fixed header
            never changes the in-flow document height — the header overlays
            content instead of reflowing it, which is what otherwise trips scroll
            anchoring and oscillates the compact/expanded state. */}
        {fixedHeader && (
          <div
            aria-hidden="true"
            style={{ height: `${expandedHeaderHeight ?? headerHeight ?? 0}px` }}
          />
        )}
        <header ref={headerRef} className={className} style={fixedHeaderStyle}>
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
            <div className={cn(styles.container, 'container')}>{children}</div>
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

// Snap a sub-pixel visualViewport metric to a stable integer with a 1px
// deadband: keep the currently committed value unless the raw reading has moved
// at least a pixel from it. Stops frame-to-frame jitter around an `.5` boundary
// from oscillating the fixed header's position and re-rendering it. See
// `updateViewportBounds`.
function quantizeViewportMetric(raw: number, current: number | null) {
  if (current === null) return Math.round(raw);
  return Math.abs(raw - current) < 1 ? current : Math.round(raw);
}

function createInvisibleClone(e: HTMLElement) {
  const clone = e.cloneNode(true) as HTMLElement;
  clone.style.position = 'absolute';
  clone.style.visibility = 'hidden';
  clone.style.width = `${e.offsetWidth}px`;
  e.parentElement?.appendChild(clone);
  return clone;
}

function removeInvisibleClone(clone: HTMLElement) {
  clone.parentElement?.removeChild(clone);
}

function getStyle(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  const obj: Record<string, string> = {};
  for (let i = 0; i < style.length; i++) {
    const prop = style[i];
    obj[prop] = style.getPropertyValue(prop);
  }
  return obj;
}

function getRelativeOffset(rect: DOMRect, containerRect: DOMRect) {
  return {
    top: rect.top - containerRect.top,
    left: rect.left - containerRect.left,
  };
}

function lockElementToRect(
  element: HTMLElement,
  rect: DOMRect,
  containerRect: DOMRect,
  options: {
    preserveHeight?: boolean;
    preserveWidth?: boolean;
    resetMargins?: boolean;
    pinToViewport?: boolean;
  } = {},
) {
  const {
    preserveHeight = true,
    preserveWidth = true,
    resetMargins = true,
    pinToViewport = false,
  } = options;

  element.style.overflow = 'hidden';

  if (preserveWidth) {
    element.style.width = `${rect.width}px`;
    element.style.maxWidth = `${rect.width}px`;
  }

  if (preserveHeight) {
    element.style.height = `${rect.height}px`;
  }

  if (resetMargins) {
    element.style.margin = '0';
  }

  if (pinToViewport) {
    element.style.position = 'fixed';
    element.style.top = `${rect.top}px`;
    element.style.left = `${rect.left}px`;
    element.style.width = `${rect.width}px`;
    element.style.maxWidth = `${rect.width}px`;
    return;
  }

  const { top, left } = getRelativeOffset(rect, containerRect);
  element.style.position = 'absolute';
  element.style.top = `${top}px`;
  element.style.left = `${left}px`;
}

function fromHomeToSearch(from: string, to: string) {
  return from === 'home' && to === 'search';
}
function fromSearchToHome(from: string, to: string) {
  return from === 'search' && to === 'home';
}
