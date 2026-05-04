'use client';

import { Skeleton } from '@digdir/designsystemet-react';
import { useEffect, useState } from 'react';
import cn from '~/lib/utils/className';
import { skeletonString } from '~/lib/utils/skeletonUtils';

export function SearchResultSkeleton({ className }: { className?: string }) {
  const [data, setData] = useState({
    title: '',
    meta1: '',
    meta2: '',
    meta3: '',
  });

  useEffect(() => {
    setData({
      title: skeletonString(30, 60),
      meta1: skeletonString(20, 50),
      meta2: skeletonString(20, 50),
      meta3: skeletonString(20, 50),
    });
  }, []);

  return (
    <div className={cn(className, 'search-result')}>
      <h2 className="ds-heading" data-size="lg">
        <Skeleton variant="text">{data.title}</Skeleton>
      </h2>
      <div className="ds-paragraph" data-size="sm">
        <div>
          <Skeleton variant="text">{data.meta1}</Skeleton>
        </div>
        <div>
          <Skeleton variant="text">{data.meta2}</Skeleton>
        </div>
        <div>
          <Skeleton variant="text">{data.meta3}</Skeleton>
        </div>
      </div>
    </div>
  );
}
