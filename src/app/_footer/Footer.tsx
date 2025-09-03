'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { EinLink } from '~/components/EinLink/EinLink';
import { EinScrollTrigger } from '~/components/EinScrollTrigger/EinScrollTrigger';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';

import styles from './Footer.module.scss';

export default function Footer() {
  const t = useTranslation();
  const pathname = usePathname();
  const footerRef = useRef<HTMLDivElement>(null);
  const footerPlaceholderRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const stick = useCallback(() => {
    // If there is no scroll bar, don't make the footer sticky
    if (document.body.scrollHeight <= window.innerHeight) {
      return;
    }

    // Update footerPlaceholder to match footer height
    if (footerRef.current && footerPlaceholderRef.current) {
      footerPlaceholderRef.current.style.height = `${footerRef.current.offsetHeight}px`;
    }

    footerRef.current?.classList.add(styles.sticky);
    footerPlaceholderRef.current?.classList.add(styles.sticky);

    // Start scroll listener to unstick when scrolled away from bottom
    const stickyScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const threshold = 1;
      const distance = Math.abs(currentScrollY - stickyScrollY);

      if (distance > threshold) {
        footerRef.current?.classList.remove(styles.sticky);
        footerPlaceholderRef.current?.classList.remove(styles.sticky);
        window.removeEventListener('scroll', handleScroll);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  }, []);

  const handleEnterBottom = useCallback(() => {
    setIsAtBottom(true);
  }, []);

  const handleExitBottom = useCallback(() => {
    setIsAtBottom(false);
  }, []);

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      if (isAtBottom) {
        // Check if nodes were added
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            stick();
            break;
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [stick, isAtBottom]);

  const getLinkClassName = (href: string) => {
    return cn('ein-link', { active: pathname === href });
  };

  return (
    <>
      <footer className={cn(styles.footer)} data-size="sm" ref={footerRef}>
        <div className="container-wrapper">
          <div className="container">
            <nav aria-label={t('footer.ariaLabel')}>
              <EinLink
                data-color="neutral"
                href="/om"
                className={getLinkClassName('/om')}
              >
                {t('footer.about')}
              </EinLink>
              <EinLink
                data-color="neutral"
                href="/personvern"
                className={getLinkClassName('/personvern')}
              >
                {t('footer.privacy')}
              </EinLink>
              <EinLink
                data-color="neutral"
                target="_blank"
                href="https://uustatus.no/nn/erklaringer/publisert/cb130c88-7d7f-4c55-b3a4-7363518b38cc"
              >
                {t('footer.accessibility')}
              </EinLink>
            </nav>
          </div>
          <div className="container-post">
            <EinLink
              href="https://github.com/felleslosninger/einnsyn-backend"
              data-color="neutral"
              target="_blank"
              rel="noopener noreferrer"
              title={t('footer.github')}
              className={styles.githubLink}
            >
              <svg
                className={styles.githubIcon}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <title>{t('footer.github')}</title>
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </EinLink>
          </div>
        </div>
      </footer>

      {/* Placeholder to prevent content shift when footer becomes sticky */}
      <div
        className={cn(styles.stickyPlaceholder)}
        ref={footerPlaceholderRef}
      />

      <EinScrollTrigger
        onEnter={handleEnterBottom}
        onExit={handleExitBottom}
        rootMargin="100px"
      />
    </>
  );
}
