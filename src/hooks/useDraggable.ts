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
          ref.current.style.transform = `translateX(${diff.x}px) translateY(${diff.y}px)`;
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
        // Prevent click-events to be fired if mouse moved
        if (moved) {
          window.addEventListener(
            'click',
            function cancelClick(_e) {
              window.removeEventListener('click', cancelClick, true);
            },
            true,
          );
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
