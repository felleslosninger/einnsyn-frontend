import { Skeleton } from '@digdir/designsystemet-react';
import cn from '~/lib/utils/className';
import { skeletonLength } from '~/lib/utils/skeletonUtils';

/**
 * Placeholder for a search result that is still loading.
 *
 * `Skeleton` gets its length through `width` instead of filler children, so the
 * placeholder characters live in `data-text` and are rendered by a pseudo
 * element — invisible to crawlers indexing the SSR markup.
 */
export function SearchResultSkeleton({
  className,
  index,
}: {
  className?: string;
  index: number;
}) {
  // Four fields per result, so each row takes its own stretch of the cycle.
  const field = index * 4;

  return (
    <div className={cn(className, 'search-result')}>
      <h2 className="ds-heading" data-size="lg">
        <Skeleton variant="text" width={skeletonLength(field, 30, 60)} />
      </h2>
      <div className="ds-paragraph" data-size="sm">
        <div>
          <Skeleton variant="text" width={skeletonLength(field + 1, 20, 50)} />
        </div>
        <div>
          <Skeleton variant="text" width={skeletonLength(field + 2, 20, 50)} />
        </div>
        <div>
          <Skeleton variant="text" width={skeletonLength(field + 3, 20, 50)} />
        </div>
      </div>
    </div>
  );
}
