'use client';

import {
  Fragment,
  isValidElement,
  type ReactNode,
  type RefObject,
  useCallback,
  useLayoutEffect,
  useRef,
} from 'react';
import cn from '~/lib/utils/className';
import { domFreeze } from '~/lib/utils/domFreeze';
import { domTransitionend } from '~/lib/utils/domTransitionend';
import styles from './EinExpandable.module.scss';

function isEmpty(node: ReactNode): boolean {
  if (node == null || typeof node === 'boolean' || node === '') return true;
  if (Array.isArray(node)) return node.every(isEmpty);
  return (
    isValidElement<{ children?: ReactNode }>(node) &&
    node.type === Fragment &&
    isEmpty(node.props.children)
  );
}

function removeFrozen(frozen: RefObject<HTMLElement | null>) {
  frozen.current?.remove();
  frozen.current = null;
}

/**
 * A panel that animates open and closed through a grid row, so nothing is
 * measured. Closed, it is inert, and content the caller keeps passing stays
 * mounted. It clips only while closed or animating, so popups in an open panel
 * are not cut off. Content dropped as it closes (a list row's detail) leaves a
 * frozen copy for the closing transition. The root carries `data-expandable`
 * so `useScrollToExpanded` can account for sibling panels mid-transition. Its
 * duration is `--ein-expandable-duration`, set in CSS.
 */
export function EinExpandable({
  expanded,
  onExpand,
  className,
  contentClassName,
  children,
}: {
  expanded: boolean;
  // Fired as the opening transition starts, with the content's height.
  onExpand?: (expandable: HTMLElement, contentHeight: number) => void;
  className?: string;
  contentClassName?: string;
  children?: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const frozenRef = useRef<HTMLElement>(null);
  // Updated in a layout effect, so it still holds the last commit's value when
  // React removes dropped content.
  const wasExpanded = useRef(expanded);
  // Content that renders nothing has to unmount the wrapper: its ref cleanup
  // is what leaves the frozen copy
  const hasContent = !isEmpty(children);

  const attachContent = useCallback((content: HTMLDivElement) => {
    removeFrozen(frozenRef);
    contentRef.current = content;
    // Runs while the content is still in place. When the whole panel goes,
    // React has already cleared `rootRef`, and no copy is needed.
    return () => {
      contentRef.current = null;
      const root = rootRef.current;
      if (!root || !wasExpanded.current) return;
      const frozen = domFreeze(content);
      content.after(frozen);
      frozenRef.current = frozen;
      domTransitionend(root, 'grid-template-rows').then(() => {
        if (frozenRef.current === frozen) removeFrozen(frozenRef);
      });
    };
  }, []);

  useLayoutEffect(() => {
    if (expanded) {
      removeFrozen(frozenRef);
      const root = rootRef.current;
      const content = contentRef.current;
      if (!wasExpanded.current && onExpand && root && content) {
        // The row is still closed, while the content has its full height
        onExpand(root, content.getBoundingClientRect().height);
      }
    }
    wasExpanded.current = expanded;
  });

  return (
    <div
      ref={rootRef}
      className={cn(styles.expandable, className)}
      inert={!expanded}
      data-expandable=""
    >
      {hasContent && (
        <div ref={attachContent} className={contentClassName}>
          {children}
        </div>
      )}
    </div>
  );
}
