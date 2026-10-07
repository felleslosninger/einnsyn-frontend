import type { ReactNode } from 'react';
import cn from '~/lib/utils/className';
import styles from './EntityPageLayout.module.scss';

/**
 * The shared page frame for a single entity — saksmappe, moetemappe, and so on.
 *
 * Four slots, laid out as one grid so the `card` column can run beside both the
 * header and the content (see the stylesheet for why that has to be one grid):
 *
 *     kind     kind     full-width entity-kind row
 *     header   card     title + metadata, side card beside it
 *     content  card     whatever the page puts below the header
 *
 * `card` is optional; without it the grid stays a single column so no empty
 * gutter is reserved. Each slot takes a node rather than data, so an entity type
 * only has to supply its own header and content — nothing here knows about any
 * particular entity, or about what the content happens to be.
 */
export default function EntityPageLayout({
  kind,
  header,
  card,
  children,
}: {
  kind: ReactNode;
  header: ReactNode;
  card?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="container-wrapper">
      <div className="container-pre collapsible" />
      <div className="container">
        <div className={cn(styles.body, { [styles.withCard]: !!card })}>
          <div className={styles.kindArea}>{kind}</div>
          <div className={styles.headerArea}>{header}</div>
          {card && <div className={styles.cardArea}>{card}</div>}
          <div className={styles.contentArea}>{children}</div>
        </div>
      </div>
      <div className="container-post" />
    </div>
  );
}
