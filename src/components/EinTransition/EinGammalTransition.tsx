import type {
  MutableRefObject,
  ReactElement,
  ReactNode,
  RefAttributes,
} from 'react';
import {
  Children,
  Suspense,
  cloneElement,
  isValidElement,
  startTransition,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import useIsChanged from '~/hooks/useIsChanged';
import { domTransitionend } from '~/lib/utils/domTransitionend';

export type EinTransitionEvent = (element: HTMLElement) => Promise<void> | void;
export type EinTransitionMergeEvent = (
  newElement: HTMLElement,
  oldElement?: HTMLElement,
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
  containerRef?: MutableRefObject<HTMLElement | null>;
  events?: EinTransitionEvents;
  // If true, add class names for each step, and wait for transitionend
  withClassNames?: boolean;
};

// A list of transition event names and corresponding class names
const classNamePrefix = 'ein-transition';
const transitionEvents: [keyof EinTransitionEvents, string?][] = [
  ['onInitTransition', `${classNamePrefix}-init-transition`],
  ['onInitTransitionOut', `${classNamePrefix}-init-transition-out`],
  ['onTransitionOut', `${classNamePrefix}-transition-out`],
  ['onWaitForLoad', `${classNamePrefix}-wait-for-load`],
  ['onMerge', `${classNamePrefix}-merge`],
  ['onInitTransitionIn', `${classNamePrefix}-init-transition-in`],
  ['onTransitionIn', `${classNamePrefix}-transition-in`],
  ['onClean', `${classNamePrefix}-clean`],
  ['onDone'],
];

/**
 * Update an events object with events for each step.
 * Each step should remove the previous class name, add its own class name,
 * and wait for transitionend
 *
 * @param events The original events-object
 */
const addClassNameEvents = (events: EinTransitionEvents) => {
  const newEvents: EinTransitionEvents = {};

  transitionEvents.reduce<string | undefined>(
    (previousClassName, [eventName, className]) => {
      const originalEvent = events[eventName];
      newEvents[eventName] = async (element: HTMLElement) => {
        await originalEvent?.(element);
        // Remove previous class unless we're on the first event
        if (previousClassName !== undefined) {
          element.classList.remove(previousClassName);
        }
        // Don't add 'done' class
        if (className !== undefined) {
          element.classList.add(className);
          await domTransitionend(element);
        }
      };
      return className;
    },
    undefined,
  );

  return newEvents;
};

let idSequenceNumber = 0;
const getUniqueId = () => idSequenceNumber++;

export default function EinTransition(props: EinTransitionProps) {
  const backupContainerRef = useRef<HTMLElement>(null);
  const {
    loading = false,
    dependencies = [loading],
    children,
    withClassNames = false,
    containerRef: propChildRef = backupContainerRef,
  } = props;
  let { events = {} } = props;
  //const [transitionStep, setTransitionStep] = useTransitionState('done');
  const [transitionStep, setTransitionStep] = useState('done');
  const currentTransitionStepRef = useRef(transitionStep);
  const transitionIdRef = useRef<undefined | number>(undefined);
  const isFrontend = typeof document !== 'undefined';
  const switching = useIsChanged(dependencies, false) && isFrontend;
  const oldNodeRef = useRef<HTMLElement>(undefined);

  // Add a ref to the child if it doesn't have one
  const { child, containerRef } = useMemo(() => {
    // Make sure we have only one child
    const innerChild = Children.only(children);
    if (!isValidElement(innerChild)) {
      throw new Error(
        'EinTransition expects a single valid React element as its child.',
      );
    }

    const childRef = (innerChild.props as RefAttributes<HTMLElement>)?.ref;
    if (childRef && typeof childRef === 'object' && 'current' in childRef) {
      console.log('Has a child with a valid ref');
      return {
        child: innerChild,
        containerRef: childRef,
      };
    }

    console.log('Clone child, adding ref');
    return {
      child: cloneElement(innerChild, {
        ref: propChildRef,
      } as unknown as ReactElement),
      containerRef: propChildRef,
    };
  }, [children, propChildRef]);

  const suspend =
    !!containerRef.current &&
    isFrontend &&
    (switching ||
      transitionStep === 'initTransition' ||
      transitionStep === 'initTransitionOut' ||
      transitionStep === 'transitionOut' ||
      transitionStep === 'waitForLoad');

  // Add class name events if requested
  events = useMemo(() => {
    return withClassNames ? addClassNameEvents(events) : events;
  }, [withClassNames, events]);

  // Start a new transition when dependencies change (switching === true)
  // biome-ignore lint/correctness/useExhaustiveDependencies:
  useLayoutEffect(() => {
    console.log('USE EFFECT SWITCHING', { switching });
    if (switching) {
      const domChild = containerRef.current;
      // Create new transition ID
      const transitionId = getUniqueId();
      transitionIdRef.current = transitionId;

      // If we're already transitioning out, no need to go back to initTransition
      if (
        transitionStep === 'initTransition' ||
        transitionStep === 'initTransitionOut' ||
        transitionStep === 'transitionOut' ||
        transitionStep === 'waitForLoad'
      ) {
        // Noop
      } else {
        // Reset domChild if needed
        currentTransitionStepRef.current = 'done';
        console.log('setTransitionStep -> initTransition');
        startTransition(() => setTransitionStep('initTransition'));
      }
    }
  }, [switching]);

  const updateStep = () => {
    const domChild = containerRef.current;
    const transitionId = transitionIdRef.current;

    console.log('UpdateStep', {
      suspend,
      domChild: !!domChild,
      transitionStep,
      currentTransitionStep: currentTransitionStepRef.current,
    });
    if (domChild && currentTransitionStepRef.current !== transitionStep) {
      console.log('keep updating to ', transitionStep);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      currentTransitionStepRef.current = transitionStep;
      (async () => {
        switch (transitionStep) {
          case 'initTransition': {
            if (transitionId !== transitionIdRef.current) return;
            await events.onInitTransition?.(domChild);
            if (transitionId !== transitionIdRef.current) return;
            startTransition(() => setTransitionStep('initTransitionOut'));
            break;
          }

          case 'initTransitionOut': {
            if (transitionId !== transitionIdRef.current) return;
            await events.onInitTransitionOut?.(domChild);
            if (transitionId !== transitionIdRef.current) return;
            startTransition(() => setTransitionStep('transitionOut'));
            break;
          }

          case 'transitionOut': {
            if (transitionId !== transitionIdRef.current) return;
            await events.onTransitionOut?.(domChild);
            if (transitionId !== transitionIdRef.current) return;
            startTransition(() => setTransitionStep('waitForLoad'));
            break;
          }

          case 'waitForLoad': {
            if (transitionId !== transitionIdRef.current) return;
            if (loading) {
              await events.onWaitForLoad?.(domChild);
              if (transitionId !== transitionIdRef.current) return;
            }
            // Prepare old node for merge
            if (events.onMerge) {
              oldNodeRef.current = domChild.cloneNode(true) as HTMLElement;
            }
            startTransition(() => setTransitionStep('merge'));
            break;
          }

          case 'merge': {
            if (transitionId !== transitionIdRef.current) return;
            if (events.onMerge) {
              await events.onMerge(domChild, oldNodeRef.current);
              if (transitionId !== transitionIdRef.current) return;
            }
            startTransition(() => setTransitionStep('initTransitionIn'));
            break;
          }

          case 'initTransitionIn': {
            if (transitionId !== transitionIdRef.current) return;
            await events.onInitTransitionIn?.(domChild);
            if (transitionId !== transitionIdRef.current) return;
            startTransition(() => setTransitionStep('transitionIn'));
            break;
          }

          case 'transitionIn': {
            if (transitionId !== transitionIdRef.current) return;
            await events.onTransitionIn?.(domChild);
            if (transitionId !== transitionIdRef.current) return;
            startTransition(() => setTransitionStep('clean'));
            break;
          }

          case 'clean': {
            if (transitionId !== transitionIdRef.current) return;
            await events.onClean?.(domChild);
            if (transitionId !== transitionIdRef.current) return;
            events.onDone?.(domChild);
            startTransition(() => setTransitionStep('done'));
            break;
          }
        }
      })();
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies:
  useLayoutEffect(updateStep, [containerRef, events, loading, transitionStep]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  //useMemo(updateStep, [containerRef, events, loading, transitionStep]);

  console.log('EinTransition.render: ', {
    suspend,
    transitionStep,
  });
  return (
    <Suspense fallback={null}>
      <Suspender suspend={suspend}>{child}</Suspender>
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
