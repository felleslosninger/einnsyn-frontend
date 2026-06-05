'use client';

import type { ReactElement, Ref, RefAttributes } from 'react';
import {
  cloneElement,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import useIsChanged from '~/hooks/useIsChanged';
import { useMergedRefs } from '~/hooks/useMergedRef';
import { IS_BROWSER } from '~/lib/isBrowser';
import { animationFrame } from '~/lib/utils/animationFrame';
import { domFreeze } from '~/lib/utils/domFreeze';
import { domTransitionend } from '~/lib/utils/domTransitionend';
import { logger } from '~/lib/utils/logger';
import { useLoadingCounter } from './useLoadingCounter';

export type EinTransitionEvent<T extends unknown[] = unknown[]> = (
  element: HTMLElement,
  toDeps: T,
  fromDeps: T | undefined,
) => Promise<void> | void;
export type EinTransitionMergeEvent<T extends unknown[] = unknown[]> = (
  exit: HTMLElement | undefined | null,
  enter: HTMLElement,
  toDeps: T,
  fromDeps: T | undefined,
) => Promise<void> | void;
export type EinTransitionLoadEvent<T extends unknown[] = unknown[]> = (
  element?: HTMLElement,
  toDeps?: T,
  fromDeps?: T | undefined,
) => Promise<void> | void;

export type EinTransitionEvents<T extends unknown[] = unknown[]> = {
  // Clean up
  onClean?: EinTransitionEvent<T>;

  // Prepare transition
  onInitTransition?: EinTransitionEvent<T>;

  // Prepare exit transition for current content
  onInitExitTransition?: EinTransitionEvent<T>;

  // Exit transition for current content
  onExitTransition?: EinTransitionEvent<T>;

  // Wait for loading of new content
  onWaitForLoad?: EinTransitionEvent<T>;

  // Wait for optional merge of old and new content
  onMerge?: EinTransitionMergeEvent<T>;

  // Prepare entry transition for new content
  onInitEnterTransition?: EinTransitionEvent<T>;

  // Entry transition for new content
  onEnterTransition?: EinTransitionEvent<T>;

  // Done
  onDone?: EinTransitionEvent<T>;
};

export type EinTransitionProps<T extends unknown[] = unknown[]> = {
  // If any of these change, a new transition will be started
  dependencies?: T;
  // If true at the waitForLoad step, wait for loading to finish
  loading?: boolean;
  // Must be a single React element with a ref
  children: (ReactElement<HTMLElement> & RefAttributes<HTMLElement>) | null;
  // Transition events
  events?: EinTransitionEvents<T>;
  // Add class names for each transition step. This way you can handle all
  // transitions in CSS. Default: false
  withClassNames?: boolean;
  // Enable / disable transitions entirely. Default: true
  enabled?: boolean;
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

export function EinTransition<T extends unknown[] = [number]>(
  props: EinTransitionProps<T>,
) {
  const {
    loading = false,
    children,
    withClassNames = false,
    enabled = true,
  } = props;

  // A counter that increments every time loading changes from false to true.
  // This way we can change the fallback-dependencies when loading changes
  // to *true* (and not when it changes to false)
  const loadingCounter = useLoadingCounter(loading);
  const dependencies = useMemo(
    () => props.dependencies ?? [loadingCounter],
    [props.dependencies, loadingCounter],
  ) as T;

  if (children !== null && !isValidElement(children)) {
    throw new Error(
      'EinTransition requires a single React element as children',
    );
  }

  // State management
  const [transitionStep, setTransitionStep] = useState<TransitionStep>('idle');
  const [hideNew, setHideNew] = useState(false);

  // Refs
  const childRef = useRef<HTMLElement>(null);
  const childsOriginalRef = (
    children as ReactElement<{ ref?: Ref<HTMLElement> }>
  )?.props?.ref;
  const mergedRef = useMergedRefs(childRef, childsOriginalRef);
  const snapshotRef = useRef<HTMLElement | null>(null);
  const transitionIdRef = useRef<number | null>(null);
  const fromDepsRef = useRef<T | undefined>(undefined);

  // Memoize events to avoid re-calculating on every render.
  const events = useMemo(
    () =>
      withClassNames && enabled
        ? addClassNameEvents(props.events)
        : (props.events ?? {}),
    [enabled, withClassNames, props.events],
  );

  // Detect when we need to transition
  const changedDeps = useIsChanged(dependencies, true);
  const shouldTransition = IS_BROWSER && enabled && changedDeps !== null;

  // Capture a snapshot of the outgoing element along with its DOM position.
  // We do this during render, before React commits, so that the parent and
  // nextSibling references stay valid even when the element is about to
  // unmount (e.g. when children transition to null).
  const snapshot =
    shouldTransition && childRef.current
      ? {
          element: domFreeze(childRef.current),
          parent: childRef.current.parentElement,
          nextSibling: childRef.current.nextSibling,
        }
      : null;

  // On the first render of a fresh-enter (no previous element to snapshot),
  // there is no chance for the useLayoutEffect below to hide the element
  // before paint — so we hide it inline here. The element stays hidden until
  // enterInit applies the initial pose, preventing a flash at the final pose.
  const isFreshEnter =
    shouldTransition && children !== null && !childRef.current;

  // Clone element and attach our ref
  const childWithRef =
    children === null
      ? null
      : cloneElement(children, {
          ref: mergedRef,
          'aria-busy': transitionStep !== 'idle',
          style: {
            ...children.props.style,
            display:
              hideNew || isFreshEnter
                ? 'none'
                : children.props.style?.display || '',
          },
        } as RefAttributes<HTMLElement>);

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

      if (!snapshot?.parent) {
        // Fresh enter (no previous element to snapshot, or it had no parent).
        // Keep the new element hidden until enterInit positions it at the
        // initial pose, otherwise it paints once at its final pose.
        fromDepsRef.current = changedDeps.previous;
        setHideNew(true);
        setTransitionStep('waitForLoad');
        return;
      }

      // Remove any existing snapshot from a prior transition
      if (snapshotRef.current?.parentElement) {
        snapshotRef.current.parentElement.removeChild(snapshotRef.current);
      }

      // Insert the snapshot at the original element's position. The original
      // may already be gone (transition to null children) — that's fine, we
      // captured parent/nextSibling at render time before commit.
      const referenceNode =
        snapshot.nextSibling?.parentNode === snapshot.parent
          ? snapshot.nextSibling
          : null;
      snapshot.parent.insertBefore(snapshot.element, referenceNode);
      snapshotRef.current = snapshot.element;

      // Hide the new content until we're ready to show it
      fromDepsRef.current = changedDeps.previous;
      setHideNew(true);
      setTransitionStep('init');
    }
  }, [changedDeps, snapshot, shouldTransition, transitionStep]);

  // Handle transition transitionSteps
  // biome-ignore lint/correctness/useExhaustiveDependencies: Do not trigger when 'loading' changes, this is handled in a separate step
  useEffect(() => {
    // Return early when idle
    if (transitionStep === 'idle') {
      return;
    }

    const transitionId = transitionIdRef.current;
    const toDeps = dependencies;
    const fromDeps = fromDepsRef.current;
    const checkStale = () => transitionIdRef.current !== transitionId;

    (async () => {
      try {
        // Initiate transition
        if (transitionStep === 'init') {
          // Initialize transition
          if (checkStale()) return;
          if (snapshotRef.current) {
            await events.onInitTransition?.(
              snapshotRef.current,
              toDeps,
              fromDeps,
            );
            await animationFrame(1);
          }

          if (checkStale()) return;
          setTransitionStep('exitInit');
        }

        // Initiate exit transition
        else if (transitionStep === 'exitInit') {
          // Initialize exit
          if (checkStale()) return;
          if (snapshotRef.current) {
            await events.onInitExitTransition?.(
              snapshotRef.current,
              toDeps,
              fromDeps,
            );
            await animationFrame(1);
          }

          if (checkStale()) return;
          setTransitionStep('exit');
        }

        // Exit transition
        else if (transitionStep === 'exit') {
          // Perform exit transition
          if (checkStale()) return;
          if (snapshotRef.current) {
            await events.onExitTransition?.(
              snapshotRef.current,
              toDeps,
              fromDeps,
            );
            await animationFrame(1);
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
              await events.onWaitForLoad?.(
                snapshotRef.current,
                toDeps,
                fromDeps,
              );
              await animationFrame(1);
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
          await events.onMerge?.(
            snapshotRef.current,
            newElement,
            toDeps,
            fromDeps,
          );
          await animationFrame(1);

          if (checkStale()) return;
          setTransitionStep('enterInit');
        }

        // Init enter transition
        else if (transitionStep === 'enterInit') {
          // Remove snapshot from DOM
          if (snapshotRef.current?.parentElement) {
            snapshotRef.current.parentElement.removeChild(snapshotRef.current);
            snapshotRef.current = null;
          }

          const newElement = childRef.current;

          // If we don't have a new element, we're done
          if (checkStale()) return;
          if (!newElement) {
            setTransitionStep('done');
            return;
          }

          // Apply the initial entry pose while the element is still hidden,
          // so it never paints at its final pose before the animation starts.
          if (checkStale()) return;
          await events.onInitEnterTransition?.(newElement, toDeps, fromDeps);

          // Reveal — the element is now positioned at the initial pose.
          setHideNew(false);
          if (checkStale()) return;
          await animationFrame(1);

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
          await events.onEnterTransition?.(newElement, toDeps, fromDeps);
          await animationFrame(1);

          if (checkStale()) return;
          setTransitionStep('done');
        }

        // Done, clean up
        else if (transitionStep === 'done') {
          if (checkStale()) return;

          // Remove any lingering snapshot. enterInit normally does this, but
          // when transitioning to null children we skip enterInit and reach
          // `done` directly, so the snapshot would otherwise stay in the DOM.
          if (snapshotRef.current?.parentElement) {
            snapshotRef.current.parentElement.removeChild(snapshotRef.current);
            snapshotRef.current = null;
          }

          const newElement = childRef.current;

          if (newElement) {
            // Clean up
            await events.onDone?.(newElement, toDeps, fromDeps);
            await events.onClean?.(newElement, toDeps, fromDeps);
          }

          // Reset state
          setTransitionStep('idle');
          transitionIdRef.current = null;
        }
      } catch (err) {
        logger.error(`Error during transition: ${transitionStep}`, err);

        // Emergency cleanup
        setHideNew(false);
        if (snapshotRef.current?.parentElement) {
          snapshotRef.current.parentElement.removeChild(snapshotRef.current);
        }

        snapshotRef.current = null;
        setTransitionStep('idle');
        transitionIdRef.current = null;

        if (childRef.current) {
          await events.onClean?.(childRef.current, toDeps, fromDeps);
        }
      }
    })();
  }, [transitionStep, events]);

  // Handle "loading" change
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
}

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
function addClassNameEvents<T extends unknown[]>(
  events: EinTransitionEvents<T> = {},
) {
  const newEvents: EinTransitionEvents<T> = {};

  newEvents.onInitTransition = async (e, toDeps, fromDeps) => {
    await events.onInitTransition?.(e, toDeps, fromDeps);
    e.classList.add(transitionEvents.onInitTransition);
    await domTransitionend(e);
  };

  newEvents.onInitExitTransition = async (e, toDeps, fromDeps) => {
    await events.onInitExitTransition?.(e, toDeps, fromDeps);
    e.classList.add(transitionEvents.onInitExitTransition);
    await domTransitionend(e);
  };

  newEvents.onExitTransition = async (e, toDeps, fromDeps) => {
    await events.onExitTransition?.(e, toDeps, fromDeps);
    e.classList.add(transitionEvents.onExitTransition);
    await domTransitionend(e);
  };

  newEvents.onWaitForLoad = async (e, toDeps, fromDeps) => {
    if (!e) return;
    await events.onWaitForLoad?.(e, toDeps, fromDeps);
    e.classList.add(transitionEvents.onWaitForLoad);
    await domTransitionend(e);
  };

  newEvents.onInitEnterTransition = async (e, toDeps, fromDeps) => {
    await events.onInitEnterTransition?.(e, toDeps, fromDeps);
    e.classList.remove(
      transitionEvents.onInitExitTransition,
      transitionEvents.onExitTransition,
      transitionEvents.onWaitForLoad,
    );
    e.classList.add(transitionEvents.onInitEnterTransition);
    await domTransitionend(e);
  };

  newEvents.onEnterTransition = async (e, toDeps, fromDeps) => {
    await events.onEnterTransition?.(e, toDeps, fromDeps);
    e.classList.add(transitionEvents.onEnterTransition);
    await domTransitionend(e);
  };

  newEvents.onDone = async (e, toDeps, fromDeps) => {
    await events.onDone?.(e, toDeps, fromDeps);
    e.classList.remove(
      transitionEvents.onInitTransition,
      transitionEvents.onInitEnterTransition,
      transitionEvents.onEnterTransition,
    );
    await domTransitionend(e);
  };

  // Remove all transition class names
  newEvents.onClean = async (e, toDeps, fromDeps) => {
    await events.onClean?.(e, toDeps, fromDeps);
    e.classList.remove(...Object.values(transitionEvents));
  };

  return newEvents;
}
