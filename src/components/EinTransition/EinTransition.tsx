'use client';

import type { ReactElement, ReactNode, RefAttributes, RefObject } from 'react';
import {
  cloneElement,
  isValidElement,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import useIsChanged from '~/hooks/useIsChanged';
import { useWhyDidYouUpdate } from '~/hooks/whyDidYouUpdate';
import { domTransitionend } from '~/lib/utils/domTransitionend';
import { useLoadingCounter } from './useLoadingCounter';

export type EinTransitionEvent = (element: HTMLElement) => Promise<void> | void;
export type EinTransitionMergeEvent = (
  newElement: HTMLElement,
  oldElement?: HTMLElement | null,
) => Promise<void> | void;

export type EinTransitionEvents = {
  // Prepare transition
  onInitTransition?: EinTransitionEvent;

  // Prepare exit transition for current content
  onInitTransitionOut?: EinTransitionEvent;

  // Exit transition for current content
  onTransitionOut?: EinTransitionEvent;

  // Wait for loading of new content
  onWaitForLoad?: EinTransitionEvent;

  // Here we have access to a clone of the old node, and the new node
  onMerge?: EinTransitionMergeEvent;

  // Prepare entry transition for new content
  onInitTransitionIn?: EinTransitionEvent;

  // Entry transition for new content
  onTransitionIn?: EinTransitionEvent;

  // Clean up
  onClean?: EinTransitionEvent;

  // Done
  onDone?: EinTransitionEvent;
};

export type EinTransitionProps = {
  // If any of these change, a new transition will be started.
  dependencies?: unknown[];
  // If true at the waitForLoad step, wait for loading to finish
  loading?: boolean;
  children: ReactNode;
  containerRef?: RefObject<HTMLElement | null>;
  events?: EinTransitionEvents;
  // If true, add class names for each step, and wait for transitionend
  withClassNames?: boolean;
};

type TransitionState = 'transitionOut' | 'transitionIn' | undefined;

const isFrontend = typeof document !== 'undefined';

// A list of transition event names and corresponding class names
const classNamePrefix = 'ein-transition';
const transitionEvents = {
  onInitTransition: `${classNamePrefix}-init-transition`,
  onInitTransitionOut: `${classNamePrefix}-init-transition-out`,
  onTransitionOut: `${classNamePrefix}-transition-out`,
  onWaitForLoad: `${classNamePrefix}-wait-for-load`,
  onMerge: `${classNamePrefix}-merge`,
  onInitTransitionIn: `${classNamePrefix}-init-transition-in`,
  onTransitionIn: `${classNamePrefix}-transition-in`,
};

/**
 * Update an events object with events for each step.
 * Each step should remove the previous class name, add its own class name,
 * and wait for transitionend
 *
 * @param events The original events-object
 */
const addClassNameEvents = (events: EinTransitionEvents = {}) => {
  const newEvents: EinTransitionEvents = {};

  newEvents.onInitTransition = async (e) => {
    await events.onInitTransition?.(e);
    e.classList.add(transitionEvents.onInitTransition);
    await domTransitionend(e);
  };

  newEvents.onInitTransitionOut = async (e) => {
    await events.onInitTransitionOut?.(e);
    e.classList.add(transitionEvents.onInitTransitionOut);
    await domTransitionend(e);
  };

  newEvents.onTransitionOut = async (e) => {
    await events.onTransitionOut?.(e);
    e.classList.add(transitionEvents.onTransitionOut);
    await domTransitionend(e);
  };

  newEvents.onWaitForLoad = async (e) => {
    await events.onWaitForLoad?.(e);
    e.classList.add(transitionEvents.onWaitForLoad);
    await domTransitionend(e);
  };

  newEvents.onMerge = async (e, old) => {
    await events.onMerge?.(e, old);
    e.classList.add(transitionEvents.onMerge);
    await domTransitionend(e);
  };

  newEvents.onInitTransitionIn = async (e) => {
    await events.onInitTransitionIn?.(e);
    e.classList.remove(
      transitionEvents.onInitTransitionOut,
      transitionEvents.onTransitionOut,
      transitionEvents.onWaitForLoad,
      transitionEvents.onMerge,
    );
    e.classList.add(transitionEvents.onInitTransitionIn);
    await domTransitionend(e);
  };

  newEvents.onTransitionIn = async (e) => {
    await events.onTransitionIn?.(e);
    e.classList.add(transitionEvents.onTransitionIn);
    await domTransitionend(e);
  };

  newEvents.onDone = async (e) => {
    await events.onDone?.(e);
    e.classList.remove(
      transitionEvents.onInitTransitionIn,
      transitionEvents.onTransitionIn,
    );
    await domTransitionend(e);
  };

  // Remove all transition class names
  newEvents.onClean = async (e: HTMLElement) => {
    await events.onClean?.(e);
    e.classList.remove(...Object.values(transitionEvents));
    await domTransitionend(e);
  };

  return newEvents;
};

export const EinTransition = (props: EinTransitionProps) => {
  const { loading = false, children, withClassNames = false } = props;
  const loadingCounter = useLoadingCounter(loading);
  const dependencies = props.dependencies ?? [loadingCounter];
  const switching = useIsChanged(dependencies, false) && isFrontend;

  const fallbackContainerRef = useRef<HTMLElement | null>(null);
  const mergeNodeRef = useRef<HTMLElement | null>(null);
  const [previousContainer, setPreviousContainer] =
    useState<HTMLElement | null>(null);

  const transitionIdRef = useRef<undefined | symbol>(undefined);
  const [transitionState, setTransitionState] =
    useState<TransitionState>(undefined);
  const transitionStateRef = useRef<TransitionState>(transitionState);

  // Add a ref to the child if it doesn't have one
  const { container, containerRef } = useMemo(() => {
    // Make sure we have only one child
    if (!isValidElement(children)) {
      return {
        container: null,
        containerRef: fallbackContainerRef,
      };
    }

    const childRef = (children.props as RefAttributes<HTMLElement>)?.ref;
    if (childRef && typeof childRef === 'object' && 'current' in childRef) {
      return {
        container: children,
        containerRef: childRef,
      };
    }

    return {
      container: cloneElement(children, {
        ref: fallbackContainerRef,
      } as unknown as ReactElement),
      containerRef: fallbackContainerRef,
    };
  }, [children]);

  // Suspend (don't render new state) if we're transitioning *out*
  const suspend =
    isFrontend && (switching || transitionState === 'transitionOut');

  // Add class name events if requested
  const events = useMemo(
    () =>
      withClassNames ? addClassNameEvents(props.events) : (props.events ?? {}),
    [withClassNames, props.events],
  );

  useEffect(() => {
    transitionStateRef.current = transitionState;
  }, [transitionState]);

  // Transition out when dependencies change (switching)
  // At this point, we are suspending, and containerRef.current is null. Therefore,
  // we use the pointer stored in previousContainerRef.
  //
  // biome-ignore lint/correctness/useExhaustiveDependencies: Only trigger on switching
  useLayoutEffect(() => {
    if (switching) {
      // If we're already transitioning out, no need to go back to initTransition
      if (transitionState === 'transitionOut') {
        return;
      }

      // Create new transition ID
      transitionIdRef.current = Symbol();
      mergeNodeRef.current = null;

      // The node isn't attached yet, don't transition out
      //const previousContainer = previousContainerRef.current;
      if (!previousContainer) {
        setTransitionState('transitionIn');
        return;
      }

      // React Suspense sets display: none !important
      previousContainer.style.removeProperty('display');

      // Transition out
      setTransitionState('transitionOut');
      transitionStateRef.current = 'transitionOut'; // useEffect won't trigger when suspending
      (async () => {
        const checkStale = () => transitionStateRef.current !== 'transitionOut';

        try {
          // Clean before every new transition
          await events.onClean?.(previousContainer);

          // initTransition
          if (checkStale()) return;
          await events.onInitTransition?.(previousContainer);

          // initTransitionOut
          if (checkStale()) return;
          await events.onInitTransitionOut?.(previousContainer);

          // transitionOut
          if (checkStale()) return;
          await events.onTransitionOut?.(previousContainer);

          // waitForLoad
          if (loading) {
            if (checkStale()) return;
            await events.onWaitForLoad?.(previousContainer);
          }

          // merge
          if (events.onMerge) {
            mergeNodeRef.current = previousContainer.cloneNode(
              true,
            ) as HTMLElement;
          }

          if (checkStale()) return;
          setTransitionState('transitionIn');
        } catch (err) {
          console.error('Error during transition out: ', err);
          if (checkStale()) return;
          setTransitionState('transitionIn');
        }
      })();

      return () => {
        transitionIdRef.current = undefined;
        transitionStateRef.current = undefined;
      };
    }
  }, [switching]);

  // Transition in when transitionState is 'transitionIn'
  // At this point, containerRef.current should be set to the new node.
  //
  // biome-ignore lint/correctness/useExhaustiveDependencies: We only want to trigger on transitionState
  useLayoutEffect(() => {
    if (transitionState !== 'transitionIn' || loading) {
      return;
    }

    // Nothing to transition in
    const domChild = containerRef.current;
    if (!domChild) {
      setTransitionState(undefined);
      return;
    }

    setPreviousContainer(containerRef.current);
    const transitionId = transitionIdRef.current;
    (async () => {
      const checkStale = () => transitionId !== transitionIdRef.current;
      try {
        // merge
        if (events.onMerge && mergeNodeRef.current) {
          if (checkStale()) return;
          await events.onMerge(domChild, mergeNodeRef.current);
        }

        // initTransitionIn
        await events.onInitTransitionIn?.(domChild);

        // transitionIn
        if (checkStale()) return;
        await events.onTransitionIn?.(domChild);

        // clean
        if (checkStale()) return;
        await events.onClean?.(domChild);

        // done
        if (checkStale()) return;
        events.onDone?.(domChild);

        if (checkStale()) return;
        setTransitionState(undefined);
      } catch (err) {
        console.error('Error during transition in: ', err);
        setTransitionState(undefined);
      }
    })();
  }, [transitionState, loading]);

  return <SuspenseBoundary suspend={suspend}>{container}</SuspenseBoundary>;
};

function SuspenseBoundary({
  suspend,
  children,
}: {
  suspend: boolean;
  children: ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <Suspender suspend={suspend}>{children}</Suspender>
    </Suspense>
  );
}

function Suspender({
  suspend,
  children,
}: {
  suspend: boolean;
  children: ReactNode;
}) {
  if (suspend) {
    throw new Promise(() => {});
  }
  return <>{children}</>;
}
