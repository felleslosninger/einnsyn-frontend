import styles from './List.module.scss';

/**
 * Placeholder items, laid out like the real ones so the list does not shift
 * when they load.
 */
export default function ListSkeleton({
  renderItem,
}: {
  renderItem: (index: number) => React.ReactNode;
}) {
  return (
    <ul className={styles.list} aria-hidden="true">
      {[0, 1].map((index) => (
        <li key={index} className={styles.item}>
          <div className={styles.main}>{renderItem(index)}</div>
        </li>
      ))}
    </ul>
  );
}
