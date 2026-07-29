import { IS_BROWSER } from '~/lib/isBrowser';

// True when the user has asked the OS to minimise non-essential motion. Used to
// swap eased/animated transitions (smooth scroll, the breadcrumb typewriter) for
// instant ones. Read at call time (not memoised) so a mid-session setting change
// is respected.
export const prefersReducedMotion = () =>
  IS_BROWSER &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
