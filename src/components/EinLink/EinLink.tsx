'use client';

import type { LinkProps as NextLinkProps } from 'next/link';
import type React from 'react';
import { forwardRef, useCallback, useEffect } from 'react';
import cn from '~/lib/utils/className';
import { isStandardClick } from '~/lib/utils/isStandardClick';
import { useNavigation } from '../NavigationProvider/NavigationProvider';
import styles from './EinLink.module.scss';

export interface LinkProps
  extends NextLinkProps,
    React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  className?: string;
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export const EinLink = forwardRef<HTMLAnchorElement, LinkProps>(
  (
    {
      href,
      onClick,
      prefetch = true,
      replace = false,
      scroll,
      shallow,
      ...props
    },
    ref,
  ) => {
    const {
      push,
      replace: replaceRoute,
      prefetch: prefetchRoute,
    } = useNavigation();

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (onClick) {
          onClick(e);
        }

        if (!isStandardClick(e)) {
          return;
        }

        if (e.defaultPrevented) {
          return;
        }

        // Prevent default and use our navigation
        e.preventDefault();

        const options = {
          scroll: scroll ?? true,
        };

        if (replace) {
          replaceRoute(href, options);
        } else {
          push(href, options);
        }
      },
      [onClick, push, replaceRoute, replace, href, scroll],
    );

    // Handle prefetching
    useEffect(() => {
      if (prefetch && typeof href === 'string') {
        prefetchRoute(href);
      }
    }, [prefetch, href, prefetchRoute]);

    return (
      <a
        {...props}
        ref={ref}
        href={href}
        onClick={handleClick}
        className={cn(props.className, styles['ein-link'], 'ein-link')}
      />
    );
  },
);
