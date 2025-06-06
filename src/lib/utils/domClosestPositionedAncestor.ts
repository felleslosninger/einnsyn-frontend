/**
 * Get the closest positioned ancestor of an element.
 *
 * @param element
 * @returns
 */
export function getClosestPositionedAncestor(element: HTMLElement) {
  let parent = element.parentElement;

  while (parent) {
    const parentStyle = window.getComputedStyle(parent);
    const parentPosition = parentStyle.getPropertyValue('position');

    if (
      parentPosition === 'relative' ||
      parentPosition === 'absolute' ||
      parentPosition === 'fixed' ||
      parentPosition === 'sticky'
    ) {
      return parent;
    }

    if (parent === document.body) {
      return null;
    }

    parent = parent.parentElement;
  }

  return null;
}
