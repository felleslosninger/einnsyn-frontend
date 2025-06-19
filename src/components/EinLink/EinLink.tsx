import Link, { type LinkProps } from 'next/link';
import type { AnchorHTMLAttributes } from 'react';
import cn from '~/lib/utils/className';

import styles from './EinLink.module.scss';

export const EinLink = ({
  ...props
}: LinkProps & AnchorHTMLAttributes<HTMLAnchorElement>) => {
  return (
    <Link
      {...props}
      className={cn(props.className, styles['ein-link'], 'ein-link')}
    />
  );
};
