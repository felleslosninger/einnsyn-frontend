import { type RefObject, useCallback, useEffect, useRef } from 'react';

type DragDiff = {
  x: number;
  y: number;
};

type DragCallback = (diff: DragDiff) => void;

type DraggableProps = {
  ref: RefObject<HTMLElement | null>;
  enabled?: boolean;
  dragSelector?: string;
  onMove?: DragCallback;
  onEnd?: DragCallback;
};

/**
 * Check if an event is a mouse event
 *
 * @param e
 * @returns boolean
 */
function isMouseEvent(e: MouseEvent | TouchEvent): e is MouseEvent {
  return e.type.startsWith('mouse');
}

/**
 * Get coords from mouse or touch event
 *
 * @param e
 */
const getCoords = (e: TouchEvent | MouseEvent) => {
  const isMouse = isMouseEvent(e);
  return {
    x: isMouse ? e.clientX : (e.targetTouches?.[0]?.clientX ?? 0),
    y: isMouse ? e.clientY : (e.targetTouches?.[0]?.clientY ?? 0),
  };
};

/**
 * This hook will make an element draggable.
 *
 * @param param
 */
export function useDraggable({
  ref,
  enabled = true,
  dragSelector,
  onMove,
  onEnd,
}: DraggableProps) {
  const cleanUpRef = useRef<undefined | (() => void)>(undefined);

  // Allow dragging the header to close on touch devices
  const startHeaderDrag = useCallback(
    (e: TouchEvent | MouseEvent) => {
      // Only react to primary mouse button and single-finger touches.
      // Right/middle clicks and multi-touch gestures (pinch, two-finger
      // scroll) should never start a drag-to-close.
      if (isMouseEvent(e)) {
        if (e.button !== 0) {
          return;
        }
      } else if (e.touches.length > 1) {
        return;
      }

      const startCoords = getCoords(e);
      const isMouse = isMouseEvent(e);
      let moved = false;
      let prevEvent = e;

      const move = (me: TouchEvent | MouseEvent) => {
        moved = true;
        prevEvent = me;
        const coords = getCoords(me);
        const diff = {
          x: coords.x - startCoords.x,
          y: coords.y - startCoords.y,
        };
        onMove?.(diff);
        if (ref.current) {
          // Use the `translate` CSS property (independent of `transform`) so
          // callers can keep using `transform` for their own animations
          // without the inline drag offset overriding them.
          ref.current.style.translate = `${diff.x}px ${diff.y}px`;
          ref.current.style.transition = 'all 0s';
        }
      };

      cleanUpRef.current = () => {
        document.removeEventListener(isMouse ? 'mousemove' : 'touchmove', move);
        document.removeEventListener(isMouse ? 'mouseup' : 'touchend', end);
        cleanUpRef.current = undefined;
      };

      const end = () => {
        // Close if dragged down since start
        const coords = getCoords(prevEvent);
        onEnd?.({
          x: coords.x - startCoords.x,
          y: coords.y - startCoords.y,
        });
        // Suppress the synthetic click that browsers may dispatch as part of
        // the same interaction as the drag-release. Its lifetime is tied to
        // the interaction boundary: it lives until either (a) it catches one
        // click — the synthetic one belonging to this drag — or (b) the user
        // starts a brand-new interaction (touchstart/mousedown), at which
        // point any subsequent click is intentional and must pass through.
        if (moved) {
          const cancelClick = (clickEvent: Event) => {
            clickEvent.preventDefault();
            clickEvent.stopPropagation();
            clickEvent.stopImmediatePropagation?.();
            cleanup();
          };
          window.addEventListener('click', cancelClick, true);

          const cleanup = () => {
            window.removeEventListener('click', cancelClick, true);
            document.removeEventListener('touchstart', cleanup, true);
            document.removeEventListener('mousedown', cleanup, true);
          };
          document.addEventListener('touchstart', cleanup, true);
          document.addEventListener('mousedown', cleanup, true);
        }
        cleanUpRef.current?.();
      };

      document.addEventListener(isMouse ? 'mousemove' : 'touchmove', move);
      document.addEventListener(isMouse ? 'mouseup' : 'touchend', end);
    },
    [onEnd, onMove, ref],
  );

  useEffect(() => {
    if (enabled && ref.current) {
      // Start dragging if target is inside a container matching the selector
      // (if a selector is given)
      const maybeStartHeaderDrag =
        dragSelector === undefined
          ? startHeaderDrag
          : (e: MouseEvent | TouchEvent) => {
              const target = e.target as HTMLElement;
              const closestMatch = target.closest(dragSelector);
              if (closestMatch && ref.current?.contains(closestMatch)) {
                startHeaderDrag(e);
              }
            };

      document.addEventListener('mousedown', maybeStartHeaderDrag);
      document.addEventListener('touchstart', maybeStartHeaderDrag);
      return () => {
        document.removeEventListener('mousedown', maybeStartHeaderDrag);
        document.removeEventListener('touchstart', maybeStartHeaderDrag);
        cleanUpRef.current?.();
      };
    }
  }, [ref, enabled, dragSelector, startHeaderDrag]);
}
