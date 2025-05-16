'use client';

import { XMarkIcon } from '@navikt/aksel-icons';
import type { JSX, ReactNode, RefObject } from 'react';
import { useRef } from 'react';
import useBreakpoint from '~/hooks/useBreakpoint';
import { useModalBasepath } from '~/hooks/useModalBasepath';
import EinPopup from '../EinPopup/EinPopup';
import styles from './EinModal.module.scss';
import { useDraggable } from '~/hooks/useDraggable';
import { useScrollwheelTrap } from '~/hooks/useScrollwheelTrap';
import cn from '~/lib/utils/className';
import { useRouter } from 'next/navigation';
import { useTranslation } from '~/hooks/useTranslation';
import Link from 'next/link';

type EinModalProps = {
	open: boolean;
	children: ReactNode;
	className?: string;
	containerRef?: RefObject<HTMLDivElement>;
};

type EinModalHeaderProps = {
	title?: string;
	className?: string;
	children?: ReactNode;
};

type EinModalBodyProps = {
	children: ReactNode;
	className?: string;
	bodyRef?: RefObject<HTMLDivElement>;
};

type EinModalFooterProps = {
	children: ReactNode;
	className?: string;
	bodyRef?: RefObject<HTMLDivElement>;
};

export default function EinModal({
	open,
	children,
	className,
	containerRef: containerRefProp,
}: EinModalProps) {
	const router = useRouter();
	const basepath = useModalBasepath();
	const closeModal = () => {
		router.push(basepath);
	};
	const isMobileLayout = useBreakpoint('SM');
	const backupContainerRef = useRef<HTMLDivElement>(null);
	const containerRef = containerRefProp ?? backupContainerRef;
	const contentRef = useRef<HTMLDivElement>(null);
	const childrenArray: JSX.Element[] = Array.isArray(children)
		? children
		: [children];

	const header = childrenArray.find(
		(child) => child?.type?.name === EinModalHeader.name,
	) || <EinModal.Header title="" />;

	const body = childrenArray.find(
		(child) => child?.type?.name === EinModalBody.name,
	);

	const footer = childrenArray.find(
		(child) => child?.type?.name === EinModalFooter.name,
	);

	// Enable close-on-drag for touch devices
	useDraggable({
		ref: contentRef,
		enabled: isMobileLayout && open,
		dragSelector: `.${styles['ein-modal-header'] ?? 'ein-modal-header'}`,
		onMove: (diff) => {
			// Reduce movement upwards
			if (diff.y < 0) {
				diff.y /= 3;
			}
			diff.x = 0;
		},
		onEnd: (diff) => {
			// Close if dragged down
			if (diff.y > 0) {
				closeModal();
			}
			// Reset after EinPopup has updated classes
			setTimeout(() => {
				if (contentRef.current) {
					contentRef.current.style.transform = '';
					contentRef.current.style.transition = '';
				}
			});
		},
	});

	// Disable scrollwheel outside container
	useScrollwheelTrap(containerRef, open);

	return (
		<EinPopup
			open={open}
			setOpen={(value) => !value && closeModal()}
			className={cn(
				className,
				styles['ein-modal-container'],
				'ein-modal-container',
			)}
			containerRef={containerRef}
			transitionFromTrigger
			transitionRef={contentRef}
		>
			<div
				className={cn(styles['ein-modal-content'], 'ein-modal-content')}
				ref={contentRef}
			>
				{header}
				{body}
				{footer}
			</div>
			<div
				className={cn(styles['ein-modal-backdrop'], 'ein-modal-backdrop')}
				onWheel={() => false}
			/>
		</EinPopup>
	);
}

function EinModalHeader({ title, className, children }: EinModalHeaderProps) {
	const t = useTranslation();
	const basepath = useModalBasepath();

	return (
		<div
			className={cn(className, styles['ein-modal-header'], 'ein-modal-header')}
		>
			{children ?? <h1>{title}</h1>}
			<Link
				href={basepath}
				className={cn(
					styles['ein-modal-close-button'],
					'ein-modal-close-button',
				)}
				data-size="sm"
			>
				{t('site.close')}
				<XMarkIcon />
			</Link>
		</div>
	);
}

function EinModalBody({ children, className, bodyRef }: EinModalBodyProps) {
	return (
		<div
			className={cn(className, styles['ein-modal-body'], 'ein-modal-body')}
			ref={bodyRef}
		>
			{children}
		</div>
	);
}

function EinModalFooter({ children, className }: EinModalFooterProps) {
	return (
		<div
			className={cn(className, styles['ein-modal-footer'], 'ein-modal-footer')}
		>
			{children}
		</div>
	);
}

EinModal.Header = EinModalHeader;
EinModal.Body = EinModalBody;
EinModal.Footer = EinModalFooter;
