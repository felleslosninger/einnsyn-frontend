// Checks whether this DOM element, or any of its parents, are hidden.
export const domIsHidden = (element: HTMLElement | null): boolean => {
  if (!element) {
    return false;
  }

  if (element.style?.display === 'none') {
    return true;
  }

  return domIsHidden(element.parentElement);
};
