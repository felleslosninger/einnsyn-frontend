/**
 * Placeholder lengths as a fraction of the requested range, cycled by index so
 * that neighbouring skeletons get visibly different widths.
 */
const RATIOS = [0.92, 0.38, 0.71, 0.24, 0.55, 1, 0.44, 0.83, 0.66, 0.31, 0];

/**
 * Character count for a `<Skeleton variant="text">`, within `[min, max]`.
 *
 * Picked from a fixed table rather than Math.random() because skeletons are
 * rendered during SSR: a random width would differ between the server and the
 * first client render and trip a hydration mismatch. Pass the row's index.
 */
export function skeletonLength(
  index: number,
  min: number,
  max: number,
): number {
  const ratio = RATIOS[index % RATIOS.length];
  return Math.round(min + (max - min) * ratio);
}
