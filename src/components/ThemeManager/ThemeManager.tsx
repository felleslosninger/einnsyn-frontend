'use client';

import { useEffect } from 'react';
import { useSessionData } from '~/components/SessionDataProvider/SessionDataProvider';

/**
 * This client component listens to session data changes and updates
 * the `<html>` and `<body>` tags accordingly. This allows for
 * optimistic UI updates for theme and language without waiting for a
 * server round-trip.
 */
export default function ThemeManager() {
  const { settings } = useSessionData();

  useEffect(() => {
    document.documentElement.lang = settings.language;
    document.body.dataset.colorScheme = settings.colorScheme;
  }, [settings.language, settings.colorScheme]);

  return null;
}
