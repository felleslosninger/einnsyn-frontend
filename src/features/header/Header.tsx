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

export default function Header({ children }: { children: React.ReactNode }) {
  const { loading, optimisticPathname } = useNavigation();
  const [rootPath = 'home'] = optimisticPathname.split('/').filter(Boolean);
  const isHome = rootPath === 'home';

  const [headerHeight, setHeaderHeight] = useState<number | null>(null);
  const [fixedViewportWidth, setFixedViewportWidth] = useState<number | null>(
    null,
  );
  const [fixedViewportTop, setFixedViewportTop] = useState(0);
  const [fixedViewportLeft, setFixedViewportLeft] = useState(0);
  const { isAtTop, isScrollingDown } = useScrollState();

  // ref to the actual sticky header element
  const headerRef = useRef<HTMLElement>(null);
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
      const nextTop = Math.round(viewport?.offsetTop ?? 0);
      const nextWidth = Math.round(
        viewport?.width ?? document.documentElement.clientWidth,
      );
      const nextLeft = Math.round(viewport?.offsetLeft ?? 0);

      setFixedViewportTop((currentTop) =>
        currentTop === nextTop ? currentTop : nextTop,
      );
      setFixedViewportWidth((currentWidth) =>
        currentWidth === nextWidth ? currentWidth : nextWidth,
      );
      setFixedViewportLeft((currentLeft) =>
        currentLeft === nextLeft ? currentLeft : nextLeft,
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
    !isHome &&
    !isAtTop &&
    headerHeight !== null &&
    fixedViewportWidth !== null;

  const fixedHeaderStyle = fixedHeader
    ? {
        top: `${fixedViewportTop}px`,
        width: `${fixedViewportWidth}px`,
        maxWidth: `${fixedViewportWidth}px`,
        left: `${fixedViewportLeft}px`,
      }
    : undefined;

  // TODO: Map rootPath from language specific URL pathname to generic pathname

  const className = cn(styles.header, `section-${rootPath}`, {
    [styles.scrolled]: !isHome && isScrollingDown,
    [styles.fixed]: !isHome && fixedHeader && headerHeight !== null,
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
        {/* Spacer for fixed header: only render while header is fixed. */}
        {fixedHeader && headerHeight !== null && (
          <div aria-hidden="true" style={{ height: `${headerHeight}px` }} />
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
