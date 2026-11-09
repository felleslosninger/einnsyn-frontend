'use client';

import { useRef } from 'react';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import { resolvePath } from '~/lib/routing/pathname';
import { isModal } from '~/lib/routing/sections';

/**
 * The section of the page on screen, which is not always the one the URL
 * names: an intercepted modal route (`/login`) leaves the page beneath it
 * mounted. Optimistic, so it turns as navigation starts rather than when the
 * new route commits.
 *
 * In folder names: the root folder (`''` for home), and below an enhet its
 * case or meeting folder, so `/oslo/case/abc` and `/oslo/sak/abc` are both
 * `saksmappe`.
 */
export function usePageSection(): string {
  const { optimisticPathname } = useNavigation();
  const [folder = '', subfolder] = resolvePath(optimisticPathname);
  const section = folder === '[enhet]' ? (subfolder ?? folder) : folder;

  // A modal keeps the section under it; every other route replaces it.
  const pageSection = useRef(section);
  if (!isModal(optimisticPathname)) {
    pageSection.current = section;
  }

  return pageSection.current;
}
