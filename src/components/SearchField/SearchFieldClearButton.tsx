'use client';

import { Button } from '@digdir/designsystemet-react';
import { XMarkIcon } from '@navikt/aksel-icons';
import cn from '~/lib/utils/className';
import styles from './SearchFieldClearButton.module.scss';

type Props = {
  className?: string;
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseDown?: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

/** The X that clears one segment of the search field. */
export function SearchFieldClearButton({
  className,
  label,
  onClick,
  onMouseDown,
}: Props) {
  return (
    <Button
      className={cn(styles.clearButton, className)}
      type="button"
      onClick={onClick}
      onMouseDown={onMouseDown}
      aria-label={label}
      variant="tertiary"
    >
      <XMarkIcon className={styles.clearIcon} aria-hidden="true" />
    </Button>
  );
}
