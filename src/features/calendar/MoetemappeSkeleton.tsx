import { Skeleton } from '@digdir/designsystemet-react';
import styles from './CalendarContainer.module.scss';

export const MoetemappeSkeleton = () => (
  <div className={styles.skeleton}>
    <Skeleton variant="rectangle" height="65px" width="100%" />
  </div>
);
