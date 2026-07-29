'use client';

import { useEffect, useRef } from 'react';
import { IS_BROWSER } from '~/lib/isBrowser';
import { setHeaderCollapsed } from './useHeaderMode';

// Binary 0/1 collapse flag written to <html> and read by SaksmappeHeader's CSS,
// which switches its body (→0) and context bar (0→full) between the expanded and
// compact poses. The pose CHANGE is animated by a CSS transition there, so the
// header collapses in one step at the threshold rather than tracking the scroll
// position frame by frame.
const COLLAPSE_VAR = '--ein-header-collapse';

const noop = () => {};

// Mirror useScrollState.readScrollY: the page/viewport scroll position.
const readScrollY = () => {
  const root =
    document.scrollingElement ?? document.documentElement ?? document.body;
  return root?.scrollTop ?? window.scrollY ?? 0;
};

/**
 * Drives the two-level (saksmappe) header's scroll collapse.
 *
 * The header stays at its full (expanded) height until the page has scrolled
 * `collapseDistance` pixels — i.e. until the content below has risen exactly to
 * meet the compact header's bottom edge — then collapses to its compact pose in
 * one transition, and expands again at the same point on the way back up. A
 * single threshold (no hysteresis): collapsing only swaps a fixed-overlay
 * header's own height, never the document's, so there's no reflow to feed back
 * and oscillate the boundary.
 *
 * `collapseDistance` (the collapsing body's natural height — which, since the
 * list bar below it never collapses, is exactly the header's expanded height
 * minus its compact one) arrives after SaksmappeHeader measures itself; a
 * second effect re-evaluates once it's known without tearing
 * down the scroll listeners. This hook only flips the discrete collapsed state
 * (the CSS var on <html> plus the shared `collapsed` signal that morphs the
 * breadcrumb); SaksmappeHeader's CSS owns the actual animation.
 */
export function useHeaderCollapse({
  enabled,
  collapseDistance,
}: {
  enabled: boolean;
  collapseDistance: number | null;
}) {
  const collapseDistanceRef = useRef(collapseDistance);
  collapseDistanceRef.current = collapseDistance;
  // Lets the distance-change effect recompute without re-registering listeners.
  const applyRef = useRef<() => void>(noop);

  useEffect(() => {
    if (!IS_BROWSER || !enabled) return;

    const root = document.documentElement;
    let collapsed = false;
    let rafId: number | null = null;
    let queued = false;

    const apply = () => {
      queued = false;
      rafId = null;
      const distance = collapseDistanceRef.current;
      const next =
        distance !== null && distance > 0 && readScrollY() >= distance;
      if (next === collapsed) return;
      collapsed = next;
      root.style.setProperty(COLLAPSE_VAR, next ? '1' : '0');
      setHeaderCollapsed(next);
    };
    applyRef.current = apply;

    const queue = () => {
      if (queued) return;
      queued = true;
      rafId = requestAnimationFrame(apply);
    };

    apply();
    document.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue, { passive: true });
    window.visualViewport?.addEventListener('resize', queue, { passive: true });
    window.visualViewport?.addEventListener('scroll', queue, { passive: true });

    return () => {
      document.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
      window.visualViewport?.removeEventListener('resize', queue);
      window.visualViewport?.removeEventListener('scroll', queue);
      if (rafId !== null) cancelAnimationFrame(rafId);
      applyRef.current = noop;
      root.style.removeProperty(COLLAPSE_VAR);
      setHeaderCollapsed(false);
    };
  }, [enabled]);

  // Re-evaluate when the measured distance first arrives (or changes on resize),
  // since there may be no scroll event to trigger `apply` otherwise. The
  // dependency IS the point — `apply` reads the distance via a ref, so the
  // linter can't see it's needed.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run on distance change
  useEffect(() => {
    applyRef.current();
  }, [collapseDistance]);
}
