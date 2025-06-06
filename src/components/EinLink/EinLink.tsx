import Link, { type LinkProps } from 'next/link';
import type { AnchorHTMLAttributes } from 'react';
import cn from '~/lib/utils/className';

import styles from './EinLink.module.scss';

export type EinLinkProps = {};

export const EinLink = ({
  ...props
}: LinkProps & EinLinkProps & AnchorHTMLAttributes<HTMLAnchorElement>) => {
  return (
    <Link
      {...props}
      className={cn(props.className, styles['ein-link'], 'ein-link')}
    />
  );
};
