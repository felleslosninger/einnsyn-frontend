'use client';

import { useEffect } from 'react';
import { logger } from '~/lib/utils/logger';

export default function EinError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error(error);
  }, [error]);

  return (
    <div className="container-wrapper">
      <div className="container-pre" />
      <div className="container">
        <h2>404 Not Found</h2>
      </div>
      <div className="container-post" />
    </div>
  );
}
