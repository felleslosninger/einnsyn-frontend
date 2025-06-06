// For better type safety and autocompletion
export type PopupPosition = 'above' | 'below' | 'left' | 'right';

/**
 * Calculates the ideal position for a popup element relative to a reference element,
 * ensuring it fits within the viewport.
 */
export function calculatePopupPosition({
  popup,
  reference,
  preferredPosition = ['below', 'above', 'right', 'left'],
  offset = 8,
  offsetX = offset,
  offsetY = offset,
  snapTolerance = 0.33,
}: {
  popup: HTMLElement | DOMRect;
  reference: HTMLElement | DOMRect;
  preferredPosition?: PopupPosition[];
  offset?: number;
  offsetX?: number;
  offsetY?: number;
  // The fraction of the popup size to use as a "magnetic" snapping threshold
  snapTolerance?: number;
}): { top: number; left: number } | null {
  // Get Geometry for elements and viewport
  const popupRect =
    popup instanceof DOMRect ? popup : popup.getBoundingClientRect();
  const referenceRect =
    reference instanceof DOMRect
      ? reference
      : reference.getBoundingClientRect();

  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
  };

  // Calculate the ideal position without considering viewport collision
  const positionCalculators: Record<
    PopupPosition,
    () => { top: number; left: number }
  > = {
    above: () => ({
      top: referenceRect.top + viewport.scrollY - popupRect.height - offsetY,
      left:
        referenceRect.left +
        viewport.scrollX +
        referenceRect.width / 2 -
        popupRect.width / 2,
    }),
    below: () => ({
      top: referenceRect.bottom + viewport.scrollY + offsetY,
      left:
        referenceRect.left +
        viewport.scrollX +
        referenceRect.width / 2 -
        popupRect.width / 2,
    }),
    left: () => ({
      top:
        referenceRect.top +
        viewport.scrollY +
        referenceRect.height / 2 -
        popupRect.height / 2,
      left: referenceRect.left + viewport.scrollX - popupRect.width - offsetX,
    }),
    right: () => ({
      top:
        referenceRect.top +
        viewport.scrollY +
        referenceRect.height / 2 -
        popupRect.height / 2,
      left: referenceRect.right + viewport.scrollX + offsetX,
    }),
  };

  // Iterate through preferred positions and find the first one that fits
  for (const position of preferredPosition) {
    // Calculate the ideal centered position
    const idealPosition = positionCalculators[position]();
    let { top, left } = idealPosition;

    // Adjust the position to fit horizontally
    if (position === 'above' || position === 'below') {
      // Adjust left overflow
      if (left < viewport.scrollX) {
        left = viewport.scrollX;
      }
      // Adjust right overflow
      if (left + popupRect.width > viewport.width + viewport.scrollX) {
        left = viewport.width + viewport.scrollX - popupRect.width;
      }
    }

    // Adjust the position to fit vertically
    if (position === 'left' || position === 'right') {
      // Adjust top overflow
      if (top < viewport.scrollY) {
        top = viewport.scrollY;
      }
      // Adjust bottom overflow
      if (top + popupRect.height > viewport.height + viewport.scrollY) {
        top = viewport.height + viewport.scrollY - popupRect.height;
      }
    }

    // Magnetically snap horizontally to the reference element
    if (position === 'above' || position === 'below') {
      const snapThreshold = popupRect.width * snapTolerance;
      const refAbsLeft = referenceRect.left + viewport.scrollX;
      const refAbsRight = referenceRect.right + viewport.scrollX;

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
      const refAbsTop = referenceRect.top + viewport.scrollY;
      const refAbsBottom = referenceRect.bottom + viewport.scrollY;

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

    // Does the position actually fit inside the viewport?
    const finalRight = left + popupRect.width;
    const finalBottom = top + popupRect.height;
    if (
      top >= viewport.scrollY &&
      left >= viewport.scrollX &&
      finalBottom <= viewport.height + viewport.scrollY &&
      finalRight <= viewport.width + viewport.scrollX
    ) {
      return { top, left };
    }
  }

  console.warn(
    'calculatePopupPosition: No preferred position fits within the viewport.',
  );
  return null;
}
