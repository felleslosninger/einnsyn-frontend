// "Freeze" a DOM node by cloning it and disabling all interactive elements.
export function domFreeze(element: HTMLElement): HTMLElement {
  const frozen = element.cloneNode(true) as HTMLElement;

  // Disable all interactive elements
  frozen
    .querySelectorAll('input, button, a, select, textarea')
    .forEach((el) => {
      (el as HTMLInputElement).disabled = true;
      (el as HTMLElement).style.pointerEvents = 'none';
    });

  // Prevent any form submissions
  frozen.querySelectorAll('form').forEach((form) => {
    form.addEventListener('submit', (e) => e.preventDefault());
  });

  return frozen;
}
