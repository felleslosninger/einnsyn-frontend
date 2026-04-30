'use client';

import { Skeleton } from '@digdir/designsystemet-react';

export const MoetemappeSkeleton = () => (
  <div style={{ marginBottom: '4px' }}>
    <Skeleton
      variant="rectangle"
      height="65px"
      width="100%"
      style={{ borderRadius: '12px' }}
    />
  </div>
);
