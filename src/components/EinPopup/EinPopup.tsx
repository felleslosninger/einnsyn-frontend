'use client';

/**
 * A popup component that switches open/closed states in two steps,
 * waiting for transitionend if it is defined in css. If not, it
 * will switch immediately.
 */

import type { ReactNode, RefObject } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import type {
	EinTransitionEvent,
	EinTransitionEvents,
} from '../EinTransition/EinTransition';
import EinTransition from '../EinTransition/EinTransition';
import './EinPopup.module.scss';
import useTransitionState from '~/hooks/useTransitionState';
import useIsMounted from '~/hooks/useIsMounted';
import useIsChanged from '~/hooks/useIsChanged';
import { domTransitionend } from '~/lib/utils/domTransitionend';
import { useOnOutsideClick } from '~/hooks/useOnOutsideClick';
import { useFocusTrap } from '~/hooks/useFocusTrap';
import cn from '~/lib/utils/className';

export type EinPopupProps = {
	open: boolean;
	setOpen: (open: boolean) => void;
	closeOnOutsideClick?: boolean;
	closeOnEsc?: boolean;
	trapFocus?: boolean;
	children: ReactNode;
	events?: EinPopupEvents;
	transitionFromTrigger?: boolean;
	className?: string;
	containerRef?: RefObject<HTMLDivElement | null>;
	transitionRef?: RefObject<HTMLElement | null>;
};

export type EinPopupEvents = {
	onPreOpen?: EinTransitionEvent;
	onToOpen?: EinTransitionEvent;
	onOpen?: EinTransitionEvent;
	onPreClosed?: EinTransitionEvent;
	onToClosed?: EinTransitionEvent;
	onClosed?: EinTransitionEvent;
	onReset?: EinTransitionEvent;
};

export default function EinPopup(props: EinPopupProps) {
	const fallbackContainerRef = useRef(null);
	const {
		open = false,
		closeOnOutsideClick = true,
		closeOnEsc = true,
		trapFocus = true,
		transitionFromTrigger = false,
		className,
		children,
		events = {},
		containerRef = fallbackContainerRef,
		transitionRef = containerRef,
		setOpen = () => undefined,
	} = props;
	const triggerRef = useRef<Element | null>(null);
	const [isTransitioning, setIsTransitioning] = useTransitionState(false);
	const transitionEvents: EinTransitionEvents = {};
	const isFrontend = typeof document !== 'undefined';
	const isMounted = useIsMounted();
	const switched = useIsChanged([open]) && isMounted();

	// Mark that we're transitioning
	// biome-ignore lint/correctness/useExhaustiveDependencies: We only want to execute this when *switched* changes
	useMemo(() => {
		if (switched && !isTransitioning) {
			setIsTransitioning(true);
		}
	}, [switched]);

	if (isFrontend) {
		// Transition to open
		if (open) {
			triggerRef.current = document.activeElement;
			const triggerElement = triggerRef.current;
			const transitionElement = transitionRef.current || containerRef.current;
			// Set transition origin to triggering link's position
			if (triggerElement && transitionElement && transitionFromTrigger) {
				const triggerBounds = triggerElement.getBoundingClientRect();
				const contentBounds = transitionElement.getBoundingClientRect();
				const triggerCenter = {
					x: triggerBounds.x + triggerBounds.width / 2,
					y: triggerBounds.y + triggerBounds.height / 2,
				};
				const contentCenter = {
					x: contentBounds.x + contentBounds.width / 2,
					y: contentBounds.y + contentBounds.height / 2,
				};
				const transOrigin = {
					xPc:
						50 +
						((triggerCenter.x - contentCenter.x) / contentBounds.width) * 100,
					yPc:
						50 +
						((triggerCenter.y - contentCenter.y) / contentBounds.height) * 100,
				};
				transitionElement.style.transformOrigin = `${transOrigin.xPc}% ${transOrigin.yPc}%`;
			}
			transitionEvents.onInitTransition = async (e) => {
				// Make sure closed is set, in case this is the first render
				e.classList.remove('open');
				e.classList.add('closed', 'einPopupTransition');
			};
			transitionEvents.onInitTransitionIn = async (e) => {
				e.classList.remove('closed');
				e.classList.add('preOpen', 'open', 'einPopupTransition');
				await Promise.all([events.onPreOpen?.(e), domTransitionend(e)]);
			};
			transitionEvents.onTransitionIn = async (e) => {
				e.classList.remove('preOpen');
				e.classList.add('toOpen', 'einPopupTransition');
				await Promise.all([events.onToOpen?.(e), domTransitionend(e)]);
			};
			transitionEvents.onDone = async (e) => {
				e.classList.remove('toOpen', 'einPopupTransition');
				e.classList.add('open');
				await Promise.all([events.onOpen?.(e), domTransitionend(e)]);
				setIsTransitioning(false);
			};
		}
		// Transition to closed
		else {
			triggerRef.current = document.activeElement;
			transitionEvents.onInitTransition = async (e) => {
				// Make sure open is set
				e.classList.remove('closed');
				e.classList.add('open', 'einPopupTransition');
			};
			transitionEvents.onInitTransitionOut = async (e) => {
				e.classList.remove('open');
				e.classList.add('preClosed', 'closed', 'einPopupTransition');
				await Promise.all([events.onPreClosed?.(e), domTransitionend(e)]);
			};
			transitionEvents.onTransitionOut = async (e) => {
				e.classList.remove('preClosed');
				e.classList.add('toClosed', 'einPopupTransition');
				await Promise.all([events.onToClosed?.(e), domTransitionend(e)]);
			};
			transitionEvents.onDone = async (e) => {
				e.classList.remove('toClosed', 'einPopupTransition');
				e.classList.add('closed');
				await Promise.all([events.onClosed?.(e), domTransitionend(e)]);
				setIsTransitioning(false);
			};
		}
	}

	// Close on esc
	useEffect(() => {
		const container = containerRef.current;
		if (open && container && closeOnEsc) {
			const closeEsc = (e: KeyboardEvent) => {
				if (e.key === 'Escape') {
					setOpen(false);
				}
			};
			document.addEventListener('keyup', closeEsc);
			return () => {
				document.removeEventListener('keyup', closeEsc);
			};
		}
		return undefined;
	}, [closeOnEsc, containerRef, open, setOpen]);

	// Close on click outside
	useOnOutsideClick(containerRef, closeOnOutsideClick, () => {
		setOpen(false);
	});

	// Trap focus when open
	useFocusTrap(containerRef, trapFocus, () => setOpen(false));

	if (open || isTransitioning || switched) {
		return (
			<EinTransition dependencies={[open]} events={transitionEvents}>
				<div
					className={cn(className, { open: open, closed: !open }, 'einPopup')}
					ref={containerRef}
				>
					{children}
				</div>
			</EinTransition>
		);
	}

	return null;
}
