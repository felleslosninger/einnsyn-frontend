'use client';

import { type ReactNode, useEffect, useRef } from 'react';
import styles from './EntityPageLayout.module.scss';

/**
 * The shared page frame for a single entity — saksmappe, moetemappe, and so on.
 *
 * From `large` up, `kind` and `sidebar` stick beside `children`, which starts
 * level with the sidebar so the kind labels both. Below that, all three stack.
 * Each slot takes a node rather than data, so nothing here knows about any
 * particular entity.
 */
export default function EntityPageLayout({
  kind,
  sidebar,
  children,
}: {
  kind: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
}) {
  const sidebarRef = useRef<HTMLDivElement>(null);

  // The sidebar's sticky offset depends on its own height, which CSS can't read.
  useEffect(() => {
    const element = sidebarRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      element.style.setProperty(
        '--sidebar-height',
        `${element.offsetHeight}px`,
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="container-wrapper">
      <div className="container-pre collapsible" />
      <div className="container">
        <div className={styles.body}>
          <div ref={sidebarRef} className={styles.sidebar}>
            <div className={styles.kind}>{kind}</div>
            <div>{sidebar}</div>
          </div>
          <div className={styles.content}>{children}</div>
        </div>
      </div>
      <div className="container-post" />
    </div>
  );
}
