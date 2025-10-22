'use client';

import { Skeleton } from '@digdir/designsystemet-react';
import { useEffect, useState } from 'react';
import cn from '~/lib/utils/className';

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function filler(min: number, max: number) {
  return 'x'.repeat(rand(min, max));
}

export function SearchResultSkeleton({ className }: { className?: string }) {
  const [data, setData] = useState({
    title: '',
    meta1: '',
    meta2: '',
    meta3: '',
  });

  useEffect(() => {
    setData({
      title: filler(30, 80),
      meta1: filler(20, 50),
      meta2: filler(20, 50),
      meta3: filler(20, 50),
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
