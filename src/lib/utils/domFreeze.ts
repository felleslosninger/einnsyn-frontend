// "Freeze" a DOM node by cloning it and making the clone inert. React's
// handlers don't survive the clone, so anything the browser does by default
// (following a link, submitting a form) would bypass the router.
export function domFreeze(element: HTMLElement): HTMLElement {
  const frozen = element.cloneNode(true) as HTMLElement;
  frozen.inert = true;
  return frozen;
}
