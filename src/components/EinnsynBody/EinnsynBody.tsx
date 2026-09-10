'use client';

import type React from 'react';
import { useMemo, useRef } from 'react';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import { getSection, isModalSection } from '~/lib/routes/sections';
import cn from '~/lib/utils/className';
import styles from './EinnsynBody.module.scss';

/**
 * The app shell, carrying the section on screen as `data-section` so styling
 * can key off it (`[data-section='saksmappe'] { … }`).
 */
export function EinnsynBody({ children }: { children: React.ReactNode }) {
  const { optimisticPathname, pathname } = useNavigation();
  const currentSection = useMemo(() => getSection(pathname), [pathname]);
  const nextSection = useMemo(
    () => getSection(optimisticPathname),
    [optimisticPathname],
  );

  const pageSectionRef = useRef(nextSection);
  if (!isModalSection(nextSection)) {
    pageSectionRef.current = nextSection;
  }

  const sectionClassName =
    currentSection === nextSection
      ? currentSection
      : `${currentSection}-to-${nextSection}`;

  return (
    <div
      className={cn(
        'einnsyn-body',
        styles.body,
        styles[`section-${sectionClassName}`],
      )}
    >
      {children}
    </div>
  );
}
