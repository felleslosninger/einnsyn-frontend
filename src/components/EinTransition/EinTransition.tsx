'use client';

import {
	Children,
	Suspense,
	cloneElement,
	isValidElement,
	useEffect,
	useMemo,
	useRef,
} from 'react';
import type { ReactElement, ReactNode, RefAttributes, RefObject } from 'react';
import useIsChanged from '~/hooks/useIsChanged';
import useTransitionState from '~/hooks/useTransitionState';
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
	containerRef?: RefObject<HTMLElement | null>;
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
	} = props;
	let { containerRef = backupContainerRef, events = {} } = props;
	const [transitionStep, setTransitionStep] = useTransitionState('done');
	const currentTransitionStepRef = useRef(transitionStep);
	const transitionIdRef = useRef<undefined | number>(undefined);
	const isFrontend = typeof document !== 'undefined';
	const switching = useIsChanged(dependencies, true) && isFrontend;
	const resetRef = useRef<EinTransitionEvent>(undefined);
	const oldNodeRef = useRef<HTMLElement>(undefined);

	console.log('Is Changed? ', switching, dependencies, isFrontend);

	// Make sure we have only one child
	let child = Children.only(children);

	// Add a ref to the child if it doesn't have one
	if (isValidElement(child)) {
		// Access the child's ref from it's props
		const childRef = (child.props as RefAttributes<HTMLElement>).ref;

		// Check if the ref is a RefObject. A RefObject has a 'current' property.
		if (childRef && typeof childRef === 'object' && 'current' in childRef) {
			containerRef = childRef;
		} else {
			containerRef = props.containerRef || backupContainerRef;
			child = cloneElement(child, {
				ref: containerRef,
			} as unknown as ReactElement);
		}
	}

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
	if (switching) {
		const domChild = containerRef.current;
		(async () => {
			// Create new transition ID
			const transitionId = getUniqueId();
			transitionIdRef.current = transitionId;
			if (transitionId !== transitionIdRef.current) return;
			// Reset currentTransitionStep
			currentTransitionStepRef.current = 'done';
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
				if (domChild) {
					resetRef?.current?.(domChild);
				}
				setTransitionStep('initTransition');
			}
		})();
	}

	// In the first transitionStep (initTransition), updateStep will be run
	// in a useLayoutEffect unless the DOM node is already mounted. In all other
	// steps it will be run in a useMemo.
	let isRun = false;
	const updateStep = () => {
		const domChild = containerRef.current;
		const transitionId = transitionIdRef.current;

		if (
			!isRun &&
			domChild &&
			currentTransitionStepRef.current !== transitionStep
		) {
			isRun = true;
			currentTransitionStepRef.current = transitionStep;
			(async () => {
				switch (transitionStep) {
					case 'initTransition': {
						if (transitionId !== transitionIdRef.current) return;
						await events.onInitTransition?.(domChild);
						if (transitionId !== transitionIdRef.current) return;
						setTransitionStep('initTransitionOut');
						break;
					}

					case 'initTransitionOut': {
						if (transitionId !== transitionIdRef.current) return;
						await events.onInitTransitionOut?.(domChild);
						if (transitionId !== transitionIdRef.current) return;
						setTransitionStep('transitionOut');
						break;
					}

					case 'transitionOut': {
						if (transitionId !== transitionIdRef.current) return;
						await events.onTransitionOut?.(domChild);
						if (transitionId !== transitionIdRef.current) return;
						setTransitionStep('waitForLoad');
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
						setTransitionStep('merge');
						break;
					}

					case 'merge': {
						if (transitionId !== transitionIdRef.current) return;
						if (events.onMerge) {
							await events.onMerge(domChild, oldNodeRef.current);
							if (transitionId !== transitionIdRef.current) return;
						}
						setTransitionStep('initTransitionIn');
						break;
					}

					case 'initTransitionIn': {
						if (transitionId !== transitionIdRef.current) return;
						await events.onInitTransitionIn?.(domChild);
						if (transitionId !== transitionIdRef.current) return;
						setTransitionStep('transitionIn');
						break;
					}

					case 'transitionIn': {
						if (transitionId !== transitionIdRef.current) return;
						await events.onTransitionIn?.(domChild);
						if (transitionId !== transitionIdRef.current) return;
						setTransitionStep('clean');
						break;
					}

					case 'clean': {
						if (transitionId !== transitionIdRef.current) return;
						await events.onClean?.(domChild);
						if (transitionId !== transitionIdRef.current) return;
						events.onDone?.(domChild);
						setTransitionStep('done');
						break;
					}
				}
			})();
		}
	};

	// Try useMemo first, useEffect will not run if the DOM node is not attached
	useMemo(updateStep, [containerRef, events, loading, transitionStep]);

	// Fall back to layoutEffect, here the DOM node is guaranteed to be attached
	useEffect(updateStep, [containerRef, events, loading, transitionStep]);

	return <Suspender suspend={suspend}>{child}</Suspender>;
}

type SuspenderProps = {
	suspend: boolean;
	children: ReactNode;
};

type PromiseWrapperType = {
	promise?: Promise<void> | undefined;
	resolve?: () => void;
};

function Suspender({ suspend, children }: SuspenderProps) {
	const promiseWrapper = useRef<PromiseWrapperType>({}).current;

	function render() {
		if (suspend && !promiseWrapper.promise) {
			promiseWrapper.promise = new Promise<void>((r) => {
				promiseWrapper.resolve = r;
			});
		}
		if (suspend && promiseWrapper.promise) {
			throw promiseWrapper.promise;
		}
		if (promiseWrapper.promise) {
			promiseWrapper.resolve?.();
			promiseWrapper.promise = undefined;
		}
		return children;
	}

	return <Suspense fallback={null}>{render()}</Suspense>;
}
