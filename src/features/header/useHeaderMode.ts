'use client';

import { useSyncExternalStore } from 'react';

// The site header has two behaviour modes. Most pages use 'default' (collapse on
// scroll-down, expand on scroll-up). The saksmappe / journalpost page opts into
// 'twoLevel' — a header with two poses (expanded and compact): expanded until
// the page is scrolled past the header's collapse distance, then compact (its
// body swapped for a context bar) in one transition, expanding again at the same
// point. See Header.tsx / useHeaderCollapse.
//
// A module-level signal (mirroring setTopBoundaryProvisional in useScrollState)
// rather than URL sniffing: the saksmappe URL is locale-specific and rewritten
// (/sak -> /case), so the page itself declaring its mode is more robust than the
// header parsing rootPath. The mode owner is the content rendered into the
// header slot, which only mounts on those pages.
type HeaderMode = 'default' | 'twoLevel';

let mode: HeaderMode = 'default';
const listeners = new Set<() => void>();

export const setHeaderTwoLevel = (enabled: boolean) => {
  const next: HeaderMode = enabled ? 'twoLevel' : 'default';
  if (next === mode) return;
  mode = next;
  for (const listener of listeners) listener();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useHeaderTwoLevel = () =>
  useSyncExternalStore(
    subscribe,
    () => mode === 'twoLevel',
    () => false,
  );

// Whether the two-level header is in its compact (collapsed) pose. Published
// by the collapse driver (useHeaderCollapse) when scroll crosses the threshold,
// and read by the breadcrumb so its trailing crumb can morph from
// "Sak {saksnummer}" to the case title (and back). A discrete boolean flipped
// only on the crossing, so subscribers re-render once per collapse, not per
// scroll frame.
let collapsed = false;
const collapsedListeners = new Set<() => void>();

export const setHeaderCollapsed = (next: boolean) => {
  if (next === collapsed) return;
  collapsed = next;
  for (const listener of collapsedListeners) listener();
};

const subscribeCollapsed = (listener: () => void) => {
  collapsedListeners.add(listener);
  return () => {
    collapsedListeners.delete(listener);
  };
};

export const useHeaderCollapsed = () =>
  useSyncExternalStore(
    subscribeCollapsed,
    () => collapsed,
    () => false,
  );

// The scroll distance (px) the page must travel before the two-level header flips
// from its expanded to its compact pose — i.e. the collapsing body's natural
// height (which equals expanded − compact, since the list bar below it doesn't
// collapse). Published by SaksmappeHeader (which measures the body) and read by
// the Header's collapse driver as the collapse threshold. `null` while no
// two-level header is mounted / not yet measured.
let collapseDistance: number | null = null;
const collapseDistanceListeners = new Set<() => void>();

export const setHeaderCollapseDistance = (next: number | null) => {
  if (next === collapseDistance) return;
  collapseDistance = next;
  for (const listener of collapseDistanceListeners) listener();
};

const subscribeCollapseDistance = (listener: () => void) => {
  collapseDistanceListeners.add(listener);
  return () => {
    collapseDistanceListeners.delete(listener);
  };
};

export const useHeaderCollapseDistance = () =>
  useSyncExternalStore(
    subscribeCollapseDistance,
    () => collapseDistance,
    () => null,
  );
