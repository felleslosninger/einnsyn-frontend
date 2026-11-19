'use client';

import type { LinkProps as NextLinkProps } from 'next/link';
import type React from 'react';
import { forwardRef, useCallback } from 'react';
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
  /**
   * Drop the built-in link styling (`einLink`/`ds-link`), keeping only the
   * Next.js navigation behaviour. Use when the anchor is styled by a wrapping
   * component instead — e.g. `<EinButton asChild><EinLink unstyled /></EinButton>`,
   * where the link's underline/colour rules would otherwise fight the button.
   */
  unstyled?: boolean;
}

/** Whether the router can open `href`; mailto:, tel: and other sites can't. */
function isRoutable(href: string): boolean {
  try {
    return (
      new URL(href, window.location.href).origin === window.location.origin
    );
  } catch {
    return false;
  }
}

export const EinLink = forwardRef<HTMLAnchorElement, LinkProps>(
  (
    {
      href,
      onClick,
      // Ignored: without loading.tsx a prefetch carries only the route tree,
      // and the click fetches the whole page anyway.
      prefetch,
      replace = false,
      scroll,
      shallow,
      unstyled = false,
      ...props
    },
    ref,
  ) => {
    const { push, replace: replaceRoute } = useNavigation();

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (onClick) {
          onClick(e);
        }

        if (!isStandardClick(e)) {
          return;
        }

        if (e.defaultPrevented || !isRoutable(href)) {
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

    return (
      <a
        {...props}
        ref={ref}
        href={href}
        onClick={handleClick}
        className={cn(props.className, 'ein-link', {
          [styles.einLink]: !unstyled,
          'ds-link': !unstyled,
        })}
      />
    );
  },
);
