import cn from '~/lib/utils/className';
import styles from './HeaderBar.module.scss';

/**
 * The header's second row: tabs or a breadcrumb trail, with an optional `end`
 * action pinned right while `children` shrink. Header collapses it on scroll
 * through the `header-bar` class.
 */
export default function HeaderBar({
  children,
  end,
}: {
  children: React.ReactNode;
  end?: React.ReactNode;
}) {
  return (
    <div className={cn(styles.bar, 'header-bar')} data-color="neutral">
      <div className={styles.row}>
        <div className={styles.content}>{children}</div>
        {end}
      </div>
    </div>
  );
}
