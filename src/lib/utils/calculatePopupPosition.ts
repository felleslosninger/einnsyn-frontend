// For better type safety and autocompletion
export type PopupPosition =
  | 'above'
  | 'below'
  | 'left'
  | 'right'
  | 'belowRight'
  | 'belowLeft'
  | 'leftTop'
  | 'leftBottom'
  | 'rightTop'
  | 'rightBottom'
  | 'aboveLeft'
  | 'aboveRight'
  // Over the anchor horizontally, centred in the viewport vertically.
  | 'center';

const ABOVE_POSITIONS = new Set<PopupPosition>([
  'above',
  'aboveLeft',
  'aboveRight',
]);

const BELOW_POSITIONS = new Set<PopupPosition>([
  'below',
  'belowLeft',
  'belowRight',
]);

const HORIZONTAL_POSITIONS = new Set<PopupPosition>([
  ...ABOVE_POSITIONS,
  ...BELOW_POSITIONS,
  'center',
]);

// Horizontal positions centred on the anchor, not aligned to one of its edges.
const CENTERED_POSITIONS = new Set<PopupPosition>(['above', 'below', 'center']);

/**
 * Calculates the ideal position for a popup element relative to an anchor element:
 * the first preferred position that fits in the viewport, or else the one that
 * overflows it least.
 *
 * `anchor` is the element the popup attaches to (typically the trigger). When an
 * optional `sizeReference` is provided, the popup is clamped to its inline bounds
 * for above/below positions: if the popup would extend outside `sizeReference`
 * horizontally, it is widened to that element's width and aligned to its left
 * edge. Useful when the trigger sits inside a wider container and the popup
 * should never escape that container's inline bounds.
 */
export function calculatePopupPosition({
  popup,
  anchor,
  sizeReference,
  matchAnchorWidth = false,
  minHeight,
  preferredPosition = ['below', 'above', 'right', 'left'],
  offset = 8,
  offsetX = offset,
  offsetY = offset,
  snapTolerance = 0.33,
}: {
  popup: HTMLElement | DOMRect;
  anchor: HTMLElement | DOMRect;
  sizeReference?: HTMLElement | DOMRect;
  // above/below/center: at least the anchor's width, centred on the anchor,
  // with equal gutters to the viewport edges.
  matchAnchorWidth?: boolean;
  // Above/below positions count as fitting when this much height fits; the
  // caller shrinks the popup to the returned maxHeight. 'center' always fits.
  minHeight?: number;
  preferredPosition?: PopupPosition[];
  offset?: number;
  offsetX?: number;
  offsetY?: number;
  // The fraction of the popup size to use as a "magnetic" snapping threshold
  snapTolerance?: number;
}):
  | {
      position: string;
      top: number;
      left: number;
      width?: number;
      maxHeight?: number;
      arrowTop?: number;
      arrowLeft?: number;
    }
  | undefined {
  // Get Geometry for elements and viewport
  const popupRect =
    popup instanceof DOMRect ? popup : popup.getBoundingClientRect();
  const anchorRect =
    anchor instanceof DOMRect ? anchor : anchor.getBoundingClientRect();
  const sizeReferenceRect = sizeReference
    ? sizeReference instanceof DOMRect
      ? sizeReference
      : sizeReference.getBoundingClientRect()
    : undefined;

  const viewport = {
    width: document.documentElement.clientWidth - 2 * offsetX,
    height: document.documentElement.clientHeight - 2 * offsetY,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
  };

  // 'center' keeps 2 × offsetY to both the top and the bottom edge.
  const centerMaxHeight = Math.max(0, viewport.height - 2 * offsetY);
  const centerHeight = Math.min(popupRect.height, centerMaxHeight);

  const getAnchorWidthBounds = () => {
    // viewport.width leaves 2 × offsetX on the right; mirror it on the left.
    const minLeft = viewport.scrollX + 2 * offsetX;
    const maxRight = viewport.scrollX + viewport.width;
    const width = Math.min(
      Math.max(popupRect.width, anchorRect.width),
      maxRight - minLeft,
    );
    const left = clamp(
      anchorRect.left + viewport.scrollX + anchorRect.width / 2 - width / 2,
      minLeft,
      maxRight - width,
    );
    return { width, left };
  };

  // Calculate the ideal position without considering viewport collision
  const positionCalculators: Record<
    PopupPosition,
    () => { top: number; left: number }
  > = {
    above: () => ({
      top: anchorRect.top + viewport.scrollY - popupRect.height - offsetY,
      left:
        anchorRect.left +
        viewport.scrollX +
        anchorRect.width / 2 -
        popupRect.width / 2,
    }),
    below: () => ({
      top: anchorRect.bottom + viewport.scrollY + offsetY,
      left:
        anchorRect.left +
        viewport.scrollX +
        anchorRect.width / 2 -
        popupRect.width / 2,
    }),
    left: () => ({
      top:
        anchorRect.top +
        viewport.scrollY +
        anchorRect.height / 2 -
        popupRect.height / 2,
      left: anchorRect.left + viewport.scrollX - popupRect.width - offsetX,
    }),
    right: () => ({
      top:
        anchorRect.top +
        viewport.scrollY +
        anchorRect.height / 2 -
        popupRect.height / 2,
      left: anchorRect.right + viewport.scrollX + offsetX,
    }),
    // New positions - aligned to reference edges
    belowRight: () => ({
      top: anchorRect.bottom + viewport.scrollY + offsetY,
      left: anchorRect.right + viewport.scrollX - popupRect.width,
    }),
    belowLeft: () => ({
      top: anchorRect.bottom + viewport.scrollY + offsetY,
      left: anchorRect.left + viewport.scrollX,
    }),
    leftTop: () => ({
      top: anchorRect.top + viewport.scrollY,
      left: anchorRect.left + viewport.scrollX - popupRect.width - offsetX,
    }),
    leftBottom: () => ({
      top: anchorRect.bottom + viewport.scrollY - popupRect.height,
      left: anchorRect.left + viewport.scrollX - popupRect.width - offsetX,
    }),
    rightTop: () => ({
      top: anchorRect.top + viewport.scrollY,
      left: anchorRect.right + viewport.scrollX + offsetX,
    }),
    rightBottom: () => ({
      top: anchorRect.bottom + viewport.scrollY - popupRect.height,
      left: anchorRect.right + viewport.scrollX + offsetX,
    }),
    aboveLeft: () => ({
      top: anchorRect.top + viewport.scrollY - popupRect.height - offsetY,
      left: anchorRect.left + viewport.scrollX,
    }),
    aboveRight: () => ({
      top: anchorRect.top + viewport.scrollY - popupRect.height - offsetY,
      left: anchorRect.right + viewport.scrollX - popupRect.width,
    }),
    center: () => ({
      top: viewport.scrollY + offsetY + (viewport.height - centerHeight) / 2,
      left:
        anchorRect.left +
        viewport.scrollX +
        anchorRect.width / 2 -
        popupRect.width / 2,
    }),
  };

  let best:
    | {
        position: PopupPosition;
        top: number;
        left: number;
        width?: number;
        overflow: number;
      }
    | undefined;
  for (const position of preferredPosition) {
    // Calculate the ideal centered position
    const idealPosition = positionCalculators[position]();
    let { top, left } = idealPosition;

    // Keep the cross axis inside the viewport. A popup too big for it overflows
    // to the right or bottom, where the page can scroll to it.
    if (HORIZONTAL_POSITIONS.has(position)) {
      left = Math.max(
        viewport.scrollX,
        Math.min(left, viewport.scrollX + viewport.width - popupRect.width),
      );
    } else {
      top = Math.max(
        viewport.scrollY,
        Math.min(top, viewport.scrollY + viewport.height - popupRect.height),
      );
    }

    // Magnetically snap horizontally to the reference element
    if (position === 'above' || position === 'below') {
      const snapThreshold = popupRect.width * snapTolerance;
      const refAbsLeft = anchorRect.left + viewport.scrollX;
      const refAbsRight = anchorRect.right + viewport.scrollX;

      // Check if the adjusted left is close to the reference's left edge
      if (Math.abs(left - refAbsLeft) < snapThreshold) {
        const snappedLeft = refAbsLeft;
        // Ensure the snapped position fits in the viewport
        if (
          snappedLeft + popupRect.width <=
          viewport.width + viewport.scrollX
        ) {
          left = snappedLeft;
        }
      }
      // Check if the adjusted right is close to the reference's right edge
      else if (Math.abs(left + popupRect.width - refAbsRight) < snapThreshold) {
        const snappedLeft = refAbsRight - popupRect.width;
        // Ensure the snapped position fits
        if (snappedLeft >= viewport.scrollX) {
          left = snappedLeft;
        }
      }
    }

    // Magnetically snap vertically to the reference element
    if (position === 'left' || position === 'right') {
      const snapThreshold = popupRect.height * snapTolerance;
      const refAbsTop = anchorRect.top + viewport.scrollY;
      const refAbsBottom = anchorRect.bottom + viewport.scrollY;

      // Check if the adjusted top is close to the reference's top edge
      if (Math.abs(top - refAbsTop) < snapThreshold) {
        const snappedTop = refAbsTop;
        // Ensure the snapped position fits in the viewport
        if (
          snappedTop + popupRect.height <=
          viewport.height + viewport.scrollY
        ) {
          top = snappedTop;
        }
      }
      // Check if the adjusted bottom is close to the reference's bottom edge
      else if (
        Math.abs(top + popupRect.height - refAbsBottom) < snapThreshold
      ) {
        const snappedTop = refAbsBottom - popupRect.height;
        // Ensure the snapped position fits
        if (snappedTop >= viewport.scrollY) {
          top = snappedTop;
        }
      }
    }

    // Clamp horizontal positions to sizeReference's inline bounds. When the
    // popup would extend outside the sizeReference's left/right, snap to its
    // bounds (widening the popup if necessary).
    let width: number | undefined;
    if (sizeReferenceRect && HORIZONTAL_POSITIONS.has(position)) {
      const sizeRefLeft = sizeReferenceRect.left + viewport.scrollX;
      const sizeRefRight = sizeReferenceRect.right + viewport.scrollX;
      if (left < sizeRefLeft || left + popupRect.width > sizeRefRight) {
        width = sizeReferenceRect.width;
        left = sizeRefLeft;
      }
    }

    if (matchAnchorWidth && CENTERED_POSITIONS.has(position)) {
      ({ width, left } = getAnchorWidthBounds());
    }

    const isAbove = ABOVE_POSITIONS.has(position);
    let fitHeight = popupRect.height;
    if (position === 'center') {
      fitHeight = centerHeight;
    } else if (
      minHeight !== undefined &&
      (isAbove || BELOW_POSITIONS.has(position))
    ) {
      fitHeight = Math.min(popupRect.height, minHeight);
    }
    // A shrunk above-popup keeps its bottom edge at the anchor.
    const fitTop = isAbove ? top + popupRect.height - fitHeight : top;

    // Pixels outside the viewport at the height that has to fit, summed over
    // all four sides
    const overflow =
      Math.max(0, viewport.scrollY - fitTop) +
      Math.max(0, viewport.scrollX - left) +
      Math.max(0, fitTop + fitHeight - viewport.scrollY - viewport.height) +
      Math.max(
        0,
        left + (width ?? popupRect.width) - viewport.scrollX - viewport.width,
      );
    if (!best || overflow < best.overflow) {
      best = { position, top, left, width, overflow };
    }
    if (overflow === 0) {
      break;
    }
  }

  if (!best) {
    return undefined;
  }
  const { position, left, width } = best;
  // An above-popup that only fits shrunk starts at the viewport top and
  // shrinks to maxHeight, which ends at the anchor.
  const top =
    best.overflow === 0 ? Math.max(best.top, viewport.scrollY) : best.top;

  const arrowPositions = getArrowPosition(
    {
      top,
      left,
      bottom: top + popupRect.height,
      right: left + (width ?? popupRect.width),
    },
    {
      top: anchorRect.top + viewport.scrollY,
      left: anchorRect.left + viewport.scrollX,
      bottom: anchorRect.bottom + viewport.scrollY,
      right: anchorRect.right + viewport.scrollX,
    },
  );

  // Emit the available vertical space so callers can cap their content to it
  // (or fill it). For above-style positions that's the space above the anchor;
  // otherwise it's the space from the popup's top to the viewport bottom.
  let maxHeight: number;
  if (position === 'center') {
    maxHeight = centerMaxHeight;
  } else if (ABOVE_POSITIONS.has(position)) {
    maxHeight = Math.max(0, anchorRect.top - offsetY);
  } else {
    maxHeight = Math.max(0, viewport.scrollY + viewport.height - top);
  }

  return {
    position,
    top,
    left,
    width,
    maxHeight,
    arrowTop: arrowPositions.top,
    arrowLeft: arrowPositions.left,
  };
}

type Rect = {
  top: number;
  left: number;
  bottom: number;
  right: number;
};

const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(value, max));
};

const getArrowPosition = (popup: Rect, reference: Rect) => {
  const refCenterX = reference.left + (reference.right - reference.left) / 2;
  const refCenterY = reference.top + (reference.bottom - reference.top) / 2;
  const closestX = clamp(refCenterX, popup.left, popup.right);
  const closestY = clamp(refCenterY, popup.top, popup.bottom);

  return {
    top: closestY - popup.top,
    left: closestX - popup.left,
  };
};
