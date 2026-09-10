'use client';

import { useRef } from 'react';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import {
  getSection,
  isModalSection,
  type Section,
} from '~/lib/routes/sections';

/**
 * The section of the page on screen, which is not always the one the URL
 * names: an intercepted modal route (`/login`) leaves the page beneath it
 * mounted. Optimistic, so it turns as navigation starts rather than when the
 * new route commits.
 */
export function usePageSection(): Section {
  const { optimisticPathname } = useNavigation();
  const section = getSection(optimisticPathname);

  // A modal keeps the section under it; every other route replaces it.
  const pageSection = useRef(section);
  if (!isModalSection(section)) {
    pageSection.current = section;
  }

  return pageSection.current;
}
