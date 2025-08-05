import styles from './EinSearchField.module.scss';

type EinSearchFieldProps = {
  children?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>;

export const EinSearchField = ({ children, ...props }: EinSearchFieldProps) => {
  return (
    <div className={styles['ein-search-field']}>
      <input type="text" {...props} />
      {children && (
        <div className={styles['search-field-children']}>{children}</div>
      )}
    </div>
  );
};
