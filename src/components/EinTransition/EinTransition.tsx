import {
  Children,
  cloneElement,
  isValidElement,
  ReactElement,
  RefAttributes,
  Suspense,
  useLayoutEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react';
import type { EinTransitionEvents } from './EinGammalTransition';
import useIsChanged from '~/hooks/useIsChanged';
import useTransitionState from '~/hooks/useTransitionState';
import useIsMounted from '~/hooks/useIsMounted';

export type EinTransitionProps = {
  // If any of these change, a new transition will be started.
  dependencies?: unknown[];
  // If true at the waitForLoad step, wait for loading to finish
  loading?: boolean;
  events?: EinTransitionEvents;
  // If true, add class names for each step, and wait for transitionend
  withClassNames?: boolean;
  animateInitial?: boolean;
  ref?: RefObject<HTMLElement | null>;
  children: ReactNode;
};

let transitionCounter = 0;
function getTransitionId(): string {
  return `transition-${transitionCounter++}`;
}

const transitionOutSteps = [
  'initTransitionOut',
  'transitionOut',
  'waitForLoad',
];

const transitionInSteps = [
  'merge',
  'initTransitionIn',
  'transitionIn',
  'cleanup',
];

export default function EinTransition(props: EinTransitionProps) {
  const backupContainerRef = useRef<HTMLElement>(null);
  const {
    loading = false,
    dependencies = [loading],
    withClassNames = false,
    animateInitial = true,
    ref = backupContainerRef,
    children,
  } = props;
  const dependenciesHasChanged = useIsChanged(dependencies, !animateInitial);
  const transitionIdRef = useRef<string>('');
  const transitionStepRef = useRef<string>('done');
  const [transitionStep, setTransitionStep] = useTransitionState('done');
  const isMounted = useIsMounted();
  const shouldSuspend =
    dependenciesHasChanged || transitionOutSteps.includes(transitionStep);

  // Make sure "children" is a single ReactNode
  let child = Children.only(children);
  if (!isValidElement(child)) {
    throw new Error(
      'EinTransition expects a single valid React element as its child.',
    );
  }

  // Add ref to the child if it doesn't have one
  const childRef = (child.props as RefAttributes<HTMLElement>)?.ref;
  if (!childRef || !(typeof childRef === 'object' && 'current' in childRef)) {
    child = cloneElement(child, {
      ref: ref,
    } as unknown as ReactElement);
  }

  useLayoutEffect(() => {
    if (dependenciesHasChanged) {
      const currentTransactionStep = transitionStepRef.current;
      if (transitionOutSteps.includes(currentTransactionStep)) {
        // We're already transitioning out, no need to do anything since the correct state will be rendered eventually
        return;
      }

      transitionIdRef.current = getTransitionId();

      // Transition out if we already have a dom element
      const domElement = ref.current;
      if (domElement) {
        for (const step of transitionOutSteps) {
          console.log('STEP');
        }
      }

      console.log('START TRANSITION', {
        currentTransactionStep,
        transitionId: transitionIdRef.current,
      });
    }
  }, [dependenciesHasChanged]);

  console.log('EinTransition.Render', {
    transitionId: transitionIdRef.current,
    transitionStep,
    dependencies,
    shouldSuspend,
  });
  return (
    <Suspense fallback={null}>
      <Suspender suspend={shouldSuspend}>{children}</Suspender>
    </Suspense>
  );
}

function Suspender({
  suspend,
  children,
}: { suspend: boolean; children: ReactNode }) {
  if (suspend) {
    throw new Promise(() => {});
  }
  return <>{children}</>;
}
