'use client';

import { Skeleton } from '@digdir/designsystemet-react';

export const MoetemappeSkeleton = () => (
  <div style={{ marginBottom: '4px' }}>
    <Skeleton
      variant="rectangle"
      height="40px"
      width="100%"
      style={{ borderRadius: '4px' }}
    />
  </div>
);
