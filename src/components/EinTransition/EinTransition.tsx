'use client';

import type { ReactElement, RefAttributes } from 'react';
import {
  cloneElement,
  forwardRef,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import useIsChanged from '~/hooks/useIsChanged';
import { useMergedRefs } from '~/hooks/useMergedRef';
import { domFreeze } from '~/lib/utils/domFreeze';
import { domTransitionend } from '~/lib/utils/domTransitionend';
import { useLoadingCounter } from './useLoadingCounter';
import { logger } from '~/lib/utils/logger';

export type EinTransitionEvent = (element: HTMLElement) => Promise<void> | void;
export type EinTransitionMergeEvent = (
  exit: HTMLElement | undefined | null,
  enter: HTMLElement,
) => Promise<void> | void;
export type EinTransitionLoadEvent = (
  element?: HTMLElement,
) => Promise<void> | void;

export type EinTransitionEvents = {
  // Clean up
  onClean?: EinTransitionEvent;

  // Prepare transition
  onInitTransition?: EinTransitionEvent;

  // Prepare exit transition for current content
  onInitExitTransition?: EinTransitionEvent;

  // Exit transition for current content
  onExitTransition?: EinTransitionEvent;

  // Wait for loading of new content
  onWaitForLoad?: EinTransitionEvent;

  // Wait for optional merge of old and new content
  onMerge?: EinTransitionMergeEvent;

  // Prepare entry transition for new content
  onInitEnterTransition?: EinTransitionEvent;

  // Entry transition for new content
  onEnterTransition?: EinTransitionEvent;

  // Done
  onDone?: EinTransitionEvent;
};

export type EinTransitionProps = {
  // If any of these change, a new transition will be started
  dependencies?: unknown[];
  // If true at the waitForLoad step, wait for loading to finish
  loading?: boolean;
  // Must be a single React element with a ref
  children: (ReactElement<HTMLElement> & RefAttributes<HTMLElement>) | null;
  // Transition events
  events?: EinTransitionEvents;
  // Add class names for each transition step. This way you can handle all
  // transitions in CSS.
  withClassNames?: boolean;
};

type TransitionStep =
  | 'idle'
  | 'init'
  | 'exitInit'
  | 'exit'
  | 'waitForLoad'
  | 'merge'
  | 'enterInit'
  | 'enter'
  | 'done';

let transitionIdCounter = 0;

export const EinTransition = forwardRef<HTMLElement, EinTransitionProps>(
  (props, forwardedRef) => {
    const { loading = false, children, withClassNames = false } = props;

    // A counter that increments every time loading changes from false to true.
    // This way we can change the fallback-dependencies when loading changes
    // to *true* (and not when it changes to false)
    const loadingCounter = useLoadingCounter(loading);
    const dependencies = useMemo(
      () => props.dependencies ?? [loadingCounter],
      [props.dependencies, loadingCounter],
    );

    // Ensure we have a single element with a ref
    if (children !== null && !isValidElement(children)) {
      throw new Error(
        'EinTransition requires a single React element as children',
      );
    }

    // State management
    const [transitionStep, setTransitionStep] =
      useState<TransitionStep>('idle');
    const [hideOriginal, setHideOriginal] = useState(false);

    // Refs
    const childRef = useRef<HTMLElement>(null);
    const childsOriginalRef = children?.ref;
    const mergedRef = useMergedRefs(childRef, forwardedRef, childsOriginalRef);
    const snapshotRef = useRef<HTMLElement | null>(null);
    const transitionIdRef = useRef<number | null>(null);

    // Memoize events to avoid re-calculating on every render.
    const events = useMemo(
      () =>
        withClassNames
          ? addClassNameEvents(props.events)
          : (props.events ?? {}),
      [withClassNames, props.events],
    );

    // Clone element and attach our ref
    const childWithRef =
      children === null
        ? null
        : cloneElement(children, {
            ref: mergedRef,
            'aria-busy': transitionStep !== 'idle',
            style: {
              ...children.props.style,
              // Hide the original element during transition
              display: hideOriginal
                ? 'none'
                : children.props.style?.display || '',
            },
          } as RefAttributes<HTMLElement>);

    // Detect when we need to transition
    const shouldTransition = useIsChanged(dependencies, true);

    // Debug logging
    logger.debug(
      `[EinTransition] ${transitionStep} ${JSON.stringify({
        loading,
        shouldTransition,
        hasSnapshot: !!snapshotRef.current,
        transitionId: transitionIdRef.current,
      })}`,
    );

    // Start transition when dependencies change
    useLayoutEffect(() => {
      if (shouldTransition) {
        // No need to start another exit-transition if we're already in one
        if (
          transitionStep === 'init' ||
          transitionStep === 'exitInit' ||
          transitionStep === 'exit' ||
          transitionStep === 'waitForLoad'
        ) {
          return;
        }

        // Create a new transition ID
        const transitionId = ++transitionIdCounter;
        transitionIdRef.current = transitionId;

        // If we don't have a current element or parent, start transitionIn
        // immediately (we're probably mounting)
        const currentElement = childRef.current;
        const parent = currentElement?.parentElement;
        if (!parent) {
          setHideOriginal(false);
          setTransitionStep('waitForLoad');
          return;
        }

        // Create frozen snapshot
        const frozen = domFreeze(currentElement);

        // Remove any existing snapshot
        if (snapshotRef.current?.parentElement) {
          snapshotRef.current.parentElement.removeChild(snapshotRef.current);
        }

        // Insert the frozen element right after the original
        parent.insertBefore(frozen, currentElement.nextSibling);
        snapshotRef.current = frozen;

        // Hide the original element
        setHideOriginal(true);
        setTransitionStep('init');
      }
    }, [shouldTransition, transitionStep]);

    // Handle transition transitionSteps
    useEffect(() => {
      const transitionId = transitionIdRef.current;
      const checkStale = () => transitionIdRef.current !== transitionId;

      (async () => {
        try {
          // Initiate transition
          if (transitionStep === 'init') {
            // Initialize transition
            if (checkStale()) return;
            if (snapshotRef.current) {
              await events.onInitTransition?.(snapshotRef.current);
            }

            if (checkStale()) return;
            setTransitionStep('exitInit');
          }

          // Initiate exit transition
          else if (transitionStep === 'exitInit') {
            // Initialize exit
            if (checkStale()) return;
            if (snapshotRef.current) {
              await events.onInitExitTransition?.(snapshotRef.current);
            }

            if (checkStale()) return;
            setTransitionStep('exit');
          }

          // Exit transition
          else if (transitionStep === 'exit') {
            // Perform exit transition
            if (checkStale()) return;
            if (snapshotRef.current) {
              await events.onExitTransition?.(snapshotRef.current);
            }

            if (checkStale()) return;
            setTransitionStep('waitForLoad');
          }

          // Wait for "loading" to become false
          else if (transitionStep === 'waitForLoad') {
            // If still loading, call wait event and stay in this transitionStep
            if (checkStale()) return;
            if (loading) {
              if (snapshotRef.current) {
                await events.onWaitForLoad?.(snapshotRef.current);
              }
              return;
            }

            setTransitionStep('merge');
          }

          // Optional merge of old and new content
          else if (transitionStep === 'merge') {
            if (checkStale()) return;
            const newElement = childRef.current;

            // If we don't have a new element, we're done
            if (!newElement) {
              setTransitionStep('done');
              return;
            }

            // Perform merge
            if (checkStale()) return;
            await events.onMerge?.(snapshotRef.current, newElement);

            if (checkStale()) return;
            setTransitionStep('enterInit');
          }

          // Init enter transition
          else if (transitionStep === 'enterInit') {
            // Remove snapshot from DOM
            if (snapshotRef.current?.parentElement) {
              snapshotRef.current.parentElement.removeChild(
                snapshotRef.current,
              );
              snapshotRef.current = null;
            }

            const newElement = childRef.current;

            // If we don't have a new element, we're done
            if (checkStale()) return;
            if (!newElement) {
              setTransitionStep('done');
              return;
            }

            // Show the new element
            setHideOriginal(false);

            // Give React a moment to actually render it
            if (checkStale()) return;
            await new Promise((resolve) => requestAnimationFrame(resolve));

            // Initialize entry
            if (checkStale()) return;
            await events.onInitEnterTransition?.(newElement);

            if (checkStale()) return;
            setTransitionStep('enter');
          }

          // Enter transition
          else if (transitionStep === 'enter') {
            const newElement = childRef.current;
            if (checkStale()) return;
            if (!newElement) {
              setTransitionStep('done');
              return;
            }

            // Perform entry transition
            if (checkStale()) return;
            await events.onEnterTransition?.(newElement);

            if (checkStale()) return;
            setTransitionStep('done');
          }

          // Done, clean up
          else if (transitionStep === 'done') {
            if (checkStale()) return;

            const newElement = childRef.current;

            if (newElement) {
              // Clean up
              await events.onDone?.(newElement);
              await events.onClean?.(newElement);
            }

            // Reset state
            setTransitionStep('idle');
            transitionIdRef.current = null;
          }
        } catch (err) {
          logger.error(`Error during transition: ${transitionStep}`, err);

          // Emergency cleanup
          setHideOriginal(false);
          if (snapshotRef.current?.parentElement) {
            snapshotRef.current.parentElement.removeChild(snapshotRef.current);
          }

          snapshotRef.current = null;
          setTransitionStep('idle');
          transitionIdRef.current = null;

          if (childRef.current) {
            await events.onClean?.(childRef.current);
          }
        }
      })();
    }, [transitionStep, events, loading]);

    // If we are in the wait step, and loading becomes false, continue
    useEffect(() => {
      if (transitionStep === 'waitForLoad' && !loading) {
        setTransitionStep('merge');
      }
    }, [loading, transitionStep]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        const snapshot = snapshotRef.current;
        if (snapshot?.parentElement) {
          snapshot.parentElement.removeChild(snapshot);
        }
        transitionIdRef.current = null;
      };
    }, []);

    return childWithRef;
  },
);

const classNamePrefix = 'ein-transition';
const transitionEvents = {
  onInitTransition: `${classNamePrefix}-init-transition`,
  onInitExitTransition: `${classNamePrefix}-init-exit-transition`,
  onExitTransition: `${classNamePrefix}-exit-transition`,
  onWaitForLoad: `${classNamePrefix}-wait`,
  onInitEnterTransition: `${classNamePrefix}-init-enter-transition`,
  onEnterTransition: `${classNamePrefix}-enter-transition`,
} as const;

/**
 * Update an events object with events for each step.
 * Each step should remove the previous class name, add its own class name,
 * and wait for transitionend
 */
function addClassNameEvents(events: EinTransitionEvents = {}) {
  const newEvents: EinTransitionEvents = {};

  newEvents.onInitTransition = async (e) => {
    await events.onInitTransition?.(e);
    e.classList.add(transitionEvents.onInitTransition);
    await domTransitionend(e);
  };

  newEvents.onInitExitTransition = async (e) => {
    await events.onInitExitTransition?.(e);
    e.classList.add(transitionEvents.onInitExitTransition);
    await domTransitionend(e);
  };

  newEvents.onExitTransition = async (e) => {
    await events.onExitTransition?.(e);
    e.classList.add(transitionEvents.onExitTransition);
    await domTransitionend(e);
  };

  newEvents.onWaitForLoad = async (e) => {
    if (!e) return;
    await events.onWaitForLoad?.(e);
    e.classList.add(transitionEvents.onWaitForLoad);
    await domTransitionend(e);
  };

  newEvents.onInitEnterTransition = async (e) => {
    await events.onInitEnterTransition?.(e);
    e.classList.remove(
      transitionEvents.onInitExitTransition,
      transitionEvents.onExitTransition,
      transitionEvents.onWaitForLoad,
    );
    e.classList.add(transitionEvents.onInitEnterTransition);
    await domTransitionend(e);
  };

  newEvents.onEnterTransition = async (e) => {
    await events.onEnterTransition?.(e);
    e.classList.add(transitionEvents.onEnterTransition);
    await domTransitionend(e);
  };

  newEvents.onDone = async (e) => {
    await events.onDone?.(e);
    e.classList.remove(
      transitionEvents.onInitTransition,
      transitionEvents.onInitEnterTransition,
      transitionEvents.onEnterTransition,
    );
    await domTransitionend(e);
  };

  // Remove all transition class names
  newEvents.onClean = async (e: HTMLElement) => {
    await events.onClean?.(e);
    e.classList.remove(...Object.values(transitionEvents));
  };

  return newEvents;
}
