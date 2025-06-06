import SearchHeader from '../search/SearchHeader';
import styles from './Header.module.scss';

export default function Header() {
  return (
    <header className={styles.header}>
      <SearchHeader />
    </header>
  );
}
