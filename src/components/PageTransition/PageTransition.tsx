'use client';

import { useMemo, useRef } from 'react';
import {
  EinTransition,
  type EinTransitionEvents,
} from '~/components/EinTransition/EinTransition';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import { usePageSection } from '~/hooks/usePageSection';
import { suspendScrollDirection } from '~/hooks/useScrollState';
import type { Section } from '~/lib/routing/sections';
import cn from '~/lib/utils/className';
import styles from './PageTransition.module.scss';
import { type PageTransitionName, pageTransition } from './pageTransitionRules';

// A new object per transition, so two in a row with the same name still read as
// a change to `EinTransition`.
type Transition = { name: PageTransitionName };

// The transition the last change of section asked for. A change the rules
// answer with `null` keeps the previous one, so `EinTransition` sees nothing
// change and does not start.
function useSectionTransition(): Transition | null {
  const section = usePageSection();
  const last = useRef<{ section: Section; transition: Transition | null }>({
    section,
    transition: null,
  });
  if (section !== last.current.section) {
    const name = pageTransition(last.current.section, section);
    last.current = {
      section,
      transition: name ? { name } : last.current.transition,
    };
  }
  return last.current.transition;
}

// The transition's name, for the stylesheet to select on. The outgoing page is
// a snapshot and the incoming one a different element, so each is stamped as
// its half starts.
function markPage(element: HTMLElement, transition: Transition | null) {
  if (transition) {
    element.dataset.pageTransition = transition.name;
  }
}

// Pins the outgoing page to the viewport at the offset it was last seen. The
// router moves the scroll as soon as the navigation starts — to the top for a
// new page, or to the position of the one being returned to — and a page still
// anchored to the document would travel with it, showing a stretch nobody was
// looking at before it has finished leaving. Pinned, the scroll happens out of
// sight behind it, and the page it uncovers is already in the right place.
//
// The offset is read off the container, whose box does not depend on which of
// the two pages is in the layout at this instant.
function pinOutgoing(outgoing: HTMLElement) {
  const container = outgoing.parentElement;
  if (!container) return;
  outgoing.style.top = `${container.getBoundingClientRect().top}px`;
}

// Marks the container for as long as a transition is running. The stylesheet
// needs it because `EinTransition` takes the incoming page out of the layout
// (`display: none`) until the moment it reveals it, and the router restores the
// scroll position of the page being returned to inside that window — against a
// document that is not there, so the position is lost. The mark is what lets
// the stylesheet keep the page in the layout and hide it by other means.
function markContainer(element: HTMLElement, name: string | undefined) {
  const container = element.parentElement;
  if (!container) return;
  if (name) {
    container.dataset.pageTransition = name;
  } else {
    delete container.dataset.pageTransition;
  }
}

/**
 * The `<main>` element, with the page inside it animated when the section on
 * screen changes. Whether it animates, and how, is up to the rules in
 * `pageTransition`; the stylesheet gives each name its motion.
 *
 * The section — not the pathname — is what is watched, so a journalpost opening
 * inside its saksmappe, a new query on the search page, or a modal over either
 * one are left to the animations those views run themselves.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const { loading } = useNavigation();
  const transition = useSectionTransition();
  // Taken as the transition starts, so the header is already on its way back to
  // full height while the outgoing page leaves, and held for the length of the
  // transition: the router's scroll, and any the arriving page makes to bring
  // its own content into view, must not compact it again.
  const releaseScrollDirection = useRef<(() => void) | null>(null);

  const events = useMemo<EinTransitionEvents<[Transition | null]>>(
    () => ({
      onInitTransition: (element, [transition]) => {
        pinOutgoing(element);
        markPage(element, transition);
        markContainer(element, transition?.name);
        releaseScrollDirection.current?.();
        releaseScrollDirection.current = suspendScrollDirection();
      },
      onInitEnterTransition: (element, [transition]) => {
        markPage(element, transition);
      },
      // Before the step classes come off, so the page is never both class-less
      // and still under the rules that hide it.
      onDone: (element) => {
        markContainer(element, undefined);
      },
      // Runs at the end of every path, the error path included.
      onClean: (element) => {
        delete element.dataset.pageTransition;
        markContainer(element, undefined);
        releaseScrollDirection.current?.();
        releaseScrollDirection.current = null;
      },
    }),
    [],
  );

  return (
    // The page slides sideways, so the element it moves inside has to clip it.
    // `clip` rather than `hidden`: it makes no scroll container, which would
    // take over from the viewport for anything sticky on the page.
    <main className={cn('content-flex-grow', styles.viewport)}>
      <EinTransition
        dependencies={[transition]}
        loading={loading}
        events={events}
        withClassNames
      >
        <div className={styles.page}>{children}</div>
      </EinTransition>
    </main>
  );
}
