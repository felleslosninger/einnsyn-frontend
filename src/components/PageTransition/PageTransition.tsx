'use client';

import { useMemo, useRef } from 'react';
import {
  EinTransition,
  type EinTransitionEvents,
} from '~/components/EinTransition/EinTransition';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import { usePageSection } from '~/hooks/usePageSection';
import { suspendScrollDirection } from '~/hooks/useScrollState';
import { sectionDepth } from '~/lib/routes/sections';
import cn from '~/lib/utils/className';
import styles from './PageTransition.module.scss';

// Which way the page is travelling, as a value the stylesheet can select on.
// Only the pair of levels knows this, and by the time the incoming page is
// posed the level it came from is gone — so each side is stamped as it starts.
function markDirection(
  element: HTMLElement,
  [to]: number[],
  from: number[] | undefined,
): string | undefined {
  const previous = from?.[0];
  if (previous === undefined) return undefined;
  const direction = to > previous ? 'inward' : 'outward';
  element.dataset.pageTransition = direction;
  return direction;
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
function markContainer(element: HTMLElement, direction: string | undefined) {
  const container = element.parentElement;
  if (!container) return;
  if (direction) {
    container.dataset.pageTransition = direction;
  } else {
    delete container.dataset.pageTransition;
  }
}

/**
 * The `<main>` element, with the page inside it animated across a move between
 * search results and an entity page: the outgoing page leaves towards the side
 * it came from, the incoming one arrives from the other.
 *
 * The depth — not the pathname — is the dependency, so the transition runs on
 * exactly those moves. A journalpost opening inside its saksmappe, a new query
 * on the search page, or a modal over either one all stay on one level and are
 * left to the animations those views run themselves.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const { loading } = useNavigation();
  const depth = sectionDepth(usePageSection());
  // Taken as the transition starts, so the header is already on its way back to
  // full height while the outgoing page leaves, and held for the length of the
  // transition: the router's scroll, and any the arriving page makes to bring
  // its own content into view, must not compact it again.
  const releaseScrollDirection = useRef<(() => void) | null>(null);

  const events = useMemo<EinTransitionEvents<number[]>>(
    () => ({
      onInitTransition: (element, to, from) => {
        pinOutgoing(element);
        markContainer(element, markDirection(element, to, from));
        releaseScrollDirection.current?.();
        releaseScrollDirection.current = suspendScrollDirection();
      },
      onInitEnterTransition: (element, to, from) => {
        markDirection(element, to, from);
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
        dependencies={[depth]}
        loading={loading}
        events={events}
        withClassNames
      >
        <div className={styles.page}>{children}</div>
      </EinTransition>
    </main>
  );
}
