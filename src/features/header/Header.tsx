'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { EinLink } from '~/components/EinLink/EinLink';
import {
  EinTransition,
  type EinTransitionEvents,
} from '~/components/EinTransition/EinTransition';
import Logo from '~/components/Logo';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import useIsChanged from '~/hooks/useIsChanged';
import { useIsScrolledToTop } from '~/hooks/useIsScrolledToTop';
import { useScrollingDirection } from '~/hooks/useScrollingDirection';
import { animationFrame } from '~/lib/utils/animationFrame';
import cn from '~/lib/utils/className';
import { EASE_IN_OUT_QUART, EASE_OUT_QUART } from '~/lib/utils/cssConstants';
import { domTransitionend } from '~/lib/utils/domTransitionend';
import styles from './Header.module.scss';
import SettingsMenu from './components/SettingsMenu';
import UserMenu from './components/UserMenu';

export default function Header({ children }: { children: React.ReactNode }) {
  const { loading, optimisticPathname } = useNavigation();
  const [rootPath = 'home'] = optimisticPathname.split('/').filter(Boolean);

  const [fixedHeader, setFixedHeader] = useState(false);
  const [headerHeight, setHeaderHeight] = useState<number | null>(null);
  const isScrolledToTop = useIsScrolledToTop();
  const switchedIsScrolledToTop = useIsChanged([isScrolledToTop]);
  const hasScrolledDown = useScrollingDirection() === 'down';

  // ref to the actual sticky header element
  const headerRef = useRef<HTMLElement>(null);

  // Update headerHeight *before* setting position: fixed
  useLayoutEffect(() => {
    if (switchedIsScrolledToTop && headerRef.current) {
      if (isScrolledToTop) {
        setFixedHeader(false);
        setHeaderHeight(null);
      } else {
        setFixedHeader(true);
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    }
  }, [switchedIsScrolledToTop, isScrolledToTop]);

  // TODO: Map rootPath from language specific URL pathname to generic pathname

  const className = cn(styles.header, `section-${rootPath}`, {
    [styles.scrolled]: hasScrolledDown,
    [styles.fixed]: fixedHeader && headerHeight !== null,
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
        // biome-ignore lint/style/noNonNullAssertion: We check for head above
        const targetForm = targetHead.querySelector('form')!;
        const targetHeadRect = targetHead.getBoundingClientRect();
        const targetFormRect = targetForm.getBoundingClientRect();
        removeInvisibleClone(targetHead);

        // Transition landing page search form to header search form
        if (fromHomeToSearch(fromRootPath, toRootPath)) {
          // Animate header container
          head.style.overflow = 'hidden';
          head.style.height = `${targetHeadRect.height}px`;
          head.style.transition = `all 400ms ${EASE_IN_OUT_QUART}`;
          head.style.borderBottomColor = targetStyle['border-bottom-color'];
          head.style.borderBottomWidth = targetStyle['border-bottom-width'];

          // Animate input field
          const currentFormRect = form.getBoundingClientRect();
          const newY = targetFormRect.top - currentFormRect.top;
          const newX = targetFormRect.left - currentFormRect.left;
          form.style.transition = `all 400ms ${EASE_IN_OUT_QUART}`;
          form.style.position = 'absolute';
          form.style.top = `${currentFormRect.top}px`;
          form.style.left = `${currentFormRect.left}px`;
          form.style.width = `${targetFormRect.width}px`;
          form.style.maxWidth = `${targetFormRect.width}px`;
          form.style.transform = `translateX(${newX}px) translateY(${newY}px)`;

          await Promise.all([domTransitionend(head), domTransitionend(form)]);
        } else if (fromSearchToHome(fromRootPath, toRootPath)) {
          // Animate header container
          head.style.transition = `all 400ms ${EASE_OUT_QUART}`;
          head.style.overflow = 'hidden';
          head.style.height = `${targetHeadRect.height}px`;
          head.style.borderBottomColor = 'transparent';

          const headerTabs = head.querySelector('.header-tabs');
          if (headerTabs instanceof HTMLElement) {
            headerTabs.style.position = 'absolute';
            headerTabs.style.top = `${headerTabs.offsetTop}px`;
            headerTabs.style.left = `${headerTabs.offsetLeft}px`;
            headerTabs.style.marginLeft = '0px';
            headerTabs.style.marginRight = '0px';
            headerTabs.style.width = `${headerTabs.offsetWidth}px`;
            headerTabs.style.maxWidth = `${headerTabs.offsetWidth}px`;

            await animationFrame(2);
            headerTabs.style.transition = `all 200ms ${EASE_OUT_QUART}`;
            headerTabs.style.opacity = '0';
          }

          // Animate input field
          const currentFormRect = form.getBoundingClientRect();
          const newY = targetFormRect.top - currentFormRect.top;
          const newX = targetFormRect.left - currentFormRect.left;
          form.style.position = 'absolute';
          form.style.width = `${currentFormRect.width}px`;
          form.style.maxWidth = `${currentFormRect.width}px`;

          // Trigger a reflow, to make sure the starting position is registered
          await animationFrame(2);

          form.style.transition = `all 400ms ${EASE_OUT_QUART}`;
          form.style.top = `${currentFormRect.top}px`;
          form.style.left = `${currentFormRect.left}px`;
          form.style.width = `${targetFormRect.width}px`;
          form.style.maxWidth = `${targetFormRect.width}px`;
          form.style.transform = `translateX(${newX}px) translateY(${newY}px)`;

          await Promise.all([domTransitionend(head), domTransitionend(form)]);
        }
      },
    }),
    [className],
  );

  return (
    <EinTransition
      dependencies={transitionDeps}
      loading={loading}
      events={transitionEvents}
    >
      <div>
        {/* Spacer for fixed header: only render while header is fixed. */}
        {fixedHeader && headerHeight !== null && (
          <div aria-hidden="true" style={{ height: `${headerHeight}px` }} />
        )}
        <header ref={headerRef} className={className}>
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
                <SettingsMenu />
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

function fromHomeToSearch(from: string, to: string) {
  return from === 'home' && to === 'search';
}
function fromSearchToHome(from: string, to: string) {
  return from === 'search' && to === 'home';
}
