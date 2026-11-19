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
import { flushSync } from 'react-dom';
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
      ? freezeSnapshot(childRef.current, withClassNames)
      : null;

  // On the first render of a fresh-enter (no previous element to snapshot),
  // there is no chance for the useLayoutEffect below to hide the element
  // before paint — so we hide it inline here. The element stays hidden until
  // enterInit applies the initial styles, preventing a flash of the final styles.
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

      // Loaded but not revealed yet, so nothing new is on screen to exit: wait
      // for the newer content behind whatever snapshot is still there. Read off
      // `snapshot.element`, copied before this commit: `hideNew` may already
      // hold a reveal this render brings.
      if (snapshot?.element.style.display === 'none') {
        childRef.current?.classList.remove(...stepClassNames);
        setHideNew(true);
        setTransitionStep('waitForLoad');
        return;
      }

      if (!snapshot?.parent) {
        // Fresh enter (no previous element to snapshot, or it had no parent).
        // Keep the new element hidden until enterInit applies its initial
        // styles, otherwise it paints once with its final styles.
        fromDepsRef.current = changedDeps.previous;
        setHideNew(true);
        setTransitionStep('waitForLoad');
        return;
      }

      // Remove any existing snapshot from a prior transition
      snapshotRef.current?.remove();

      // Restarted while entering: the entering content exits from where it had
      // got to, and the live element starts over.
      transferTransitionStyles(
        childRef.current,
        snapshot.element,
        snapshot.transitionValues,
      );

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

  // Read during render: a restart in this commit replaces the ref before the
  // step effect runs, and the step it superseded must not carry on as the new
  // transition.
  const stepTransitionId = transitionIdRef.current;

  // Handle transition transitionSteps
  // biome-ignore lint/correctness/useExhaustiveDependencies: Do not trigger when 'loading' changes, this is handled in a separate step
  useEffect(() => {
    // Return early when idle
    if (transitionStep === 'idle') {
      return;
    }

    const transitionId = stepTransitionId;
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
          const newElement = childRef.current;

          // If we don't have a new element, we're done
          if (checkStale()) return;
          if (!newElement) {
            setTransitionStep('done');
            return;
          }

          // Apply the initial entry styles while the element is still hidden,
          // so it never paints with its final styles before the animation starts.
          await events.onInitEnterTransition?.(newElement, toDeps, fromDeps);
          if (checkStale()) return;

          // Swap the snapshot for the element, in its initial styles, within
          // one task. A plain state update renders in a later task, and a frame
          // painted in between shows neither (seen in Safari).
          flushSync(() => setHideNew(false));
          // flushSync also renders other pending updates. A restart among them
          // waits behind the snapshot, so it stays.
          if (checkStale()) return;
          snapshotRef.current?.remove();
          snapshotRef.current = null;
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
          snapshotRef.current?.remove();
          snapshotRef.current = null;

          const newElement = childRef.current;

          if (newElement) {
            // Clean up
            await events.onDone?.(newElement, toDeps, fromDeps);
            await events.onClean?.(newElement, toDeps, fromDeps);
          }

          // `onDone`/`onClean` await, and a dependency change during that window
          // starts a fresh transition — `done` is not one of the steps the
          // layout effect refuses to interrupt. That transition owns the state
          // machine now, so resetting below would strand it: its step is
          // overwritten with 'idle' and its id with null, after which its own
          // `checkStale` abandons it. What is left on screen is its snapshot,
          // still carrying the step class it got to, with the live element
          // hidden behind it and nothing scheduled to reveal it.
          if (checkStale()) return;

          // Reset state
          setTransitionStep('idle');
          transitionIdRef.current = null;
        }
      } catch (err) {
        logger.error(`Error during transition: ${transitionStep}`, err);

        // Emergency cleanup
        setHideNew(false);
        snapshotRef.current?.remove();
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

  // Cleanup on unmount. A layout effect, so the snapshot leaves in the same
  // commit as its owner: anything that measures in that commit (Next's scroll
  // to the new page) must not still see it.
  useLayoutEffect(() => {
    return () => {
      snapshotRef.current?.remove();
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
const stepClassNames = Object.values(transitionEvents);

type StyledElement = HTMLElement | SVGElement;
type StyleValue = { element: StyledElement; property: string; value: string };
type TransferredStyle = StyleValue & { replaced: string };

// What was transferred inline to a snapshot, oldest first, with the inline
// values they took the place of.
const transferredStyles = new WeakMap<HTMLElement, TransferredStyle[]>();

function freezeSnapshot(live: HTMLElement, withClassNames: boolean) {
  const element = domFreeze(live);
  return {
    element,
    // Only the class-name exit step clears them.
    transitionValues: withClassNames ? readTransitionValues(live, element) : [],
    parent: live.parentElement,
    nextSibling: live.nextSibling,
  };
}

/**
 * The current value of each transition running in `live`'s subtree, for the
 * matching node in `snapshot`, which starts at their end values. CSS
 * animations restart in the snapshot by themselves.
 */
function readTransitionValues(live: HTMLElement, snapshot: HTMLElement) {
  // Filled one parent's children at a time, as the targets need them, so the
  // cost follows the targets, not the size of the tree.
  const counterparts = new Map<Element, Element | null>([[live, snapshot]]);
  const counterpart = (node: Element): Element | null => {
    if (!counterparts.has(node)) {
      const parent = node.parentElement;
      const parentSnapshot = parent && counterpart(parent);
      for (
        let liveChild = parent?.firstElementChild,
          snapshotChild = parentSnapshot?.firstElementChild;
        liveChild && snapshotChild;
        liveChild = liveChild.nextElementSibling,
          snapshotChild = snapshotChild.nextElementSibling
      ) {
        counterparts.set(liveChild, snapshotChild);
      }
      if (!counterparts.has(node)) counterparts.set(node, null);
    }
    return counterparts.get(node) ?? null;
  };

  const values: StyleValue[] = [];
  // Loop all ongoing transitions in the live tree
  for (const animation of live.getAnimations({ subtree: true })) {
    if (!(animation instanceof CSSTransition)) continue;
    const { target, pseudoElement } = animation.effect as KeyframeEffect;
    if (!target || pseudoElement) continue;
    const snapshotTarget = counterpart(target);
    if (snapshotTarget) {
      const property = animation.transitionProperty;
      const value = getComputedStyle(target).getPropertyValue(property);
      values.push({
        element: snapshotTarget as StyledElement,
        property,
        value,
      });
    }
  }
  return values;
}

/**
 * Takes the step classes off `live` and its snapshot, and transfers to the
 * snapshot, inline, the values they gave `live` as of now and the
 * `transitionValues` read as it was cloned, so its exit starts from what was
 * on screen. Timing is left to the steps.
 */
function transferTransitionStyles(
  live: HTMLElement | null,
  snapshot: HTMLElement,
  transitionValues: StyleValue[],
) {
  // If interrupted before `enter`, keep the init-enter class until exit starts:
  // inline copying below only covers the root and requires a mounted `live` node.
  const keepInitialStyles =
    snapshot.classList.contains(transitionEvents.onInitEnterTransition) &&
    !snapshot.classList.contains(transitionEvents.onEnterTransition);
  snapshot.classList.remove(...stepClassNames);
  if (keepInitialStyles) {
    snapshot.classList.add(transitionEvents.onInitEnterTransition);
  }

  const transferred: TransferredStyle[] = [];
  transferredStyles.set(snapshot, transferred);
  const transfer = ({ element, property, value }: StyleValue) => {
    const replaced = element.style.getPropertyValue(property);
    element.style.setProperty(property, value);
    transferred.push({
      element,
      property,
      // As serialised, for the comparison when cleared
      value: element.style.getPropertyValue(property),
      replaced,
    });
  };

  transitionValues.forEach(transfer);

  // `live` is gone, replaced, or has no steps to undo.
  if (!live || !stepClassNames.some((name) => live.classList.contains(name))) {
    return;
  }

  const readStyles = () => {
    const style = getComputedStyle(live);
    return new Map(
      Array.from(style, (property) => {
        return [property, style.getPropertyValue(property)] as const;
      }),
    );
  };
  const currentStyles = readStyles();
  live.classList.remove(...stepClassNames);
  const finalStyles = readStyles();

  // Read later than `transitionValues`, so these replace theirs on the root. A
  // transition heading for its final value is only in `transitionValues`.
  for (const [property, value] of currentStyles) {
    if (
      value !== finalStyles.get(property) &&
      !property.startsWith('transition') &&
      !property.startsWith('animation')
    ) {
      transfer({ element: snapshot, property, value });
    }
  }
}

// Runs right before adding the exit class so exit transitions start from the
// transferred inline styles and kept init-enter class. Reverts newest first so
// properties transferred twice restore their original inline value.
function clearTransitionStyles(snapshot: HTMLElement) {
  const transferred = transferredStyles.get(snapshot) ?? [];
  for (let i = transferred.length - 1; i >= 0; i--) {
    const { element, property, value, replaced } = transferred[i];
    // Unless an event has set it since
    if (element.style.getPropertyValue(property) === value) {
      element.style.setProperty(property, replaced);
    }
  }
  transferredStyles.delete(snapshot);
  snapshot.classList.remove(transitionEvents.onInitEnterTransition);
}

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
    clearTransitionStyles(e);
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
    e.classList.remove(...stepClassNames);
  };

  return newEvents;
}
