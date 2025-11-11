/**
 * A promise that is resolved when the transitionend event is triggered for the element.
 *
 * @param element DOM element
 * @param expectImmediate Assume a transition is already running, fulfill promise when
 *    transitionDelay has passed unless the event has been triggered. This is useful
 *    for instance when no css transition is specified and the promise should be resolved
 *    immediately. Default: true
 * @param propertyName Listen only to transitions on a specific variable
 */
export function domTransitionend(
  element: HTMLElement,
  expectImmediate?: boolean,
  propertyName?: string,
): Promise<void>;
export function domTransitionend(
  element: HTMLElement,
  propertyName?: string,
): Promise<void>;
export function domTransitionend(...args: unknown[]): Promise<void> {
  let i = 0;
  const element =
    args[i] instanceof HTMLElement ? (args[i++] as HTMLElement) : undefined;
  const expectImmediate =
    typeof args[i] === 'boolean' ? (args[i++] as boolean) : true;
  const propertyName =
    typeof args[i] === 'string' ? (args[i++] as string) : undefined;
  let timeout: number;

  if (element === undefined) {
    throw new Error('domTransitionend: No element given');
  }

  return new Promise((resolve) => {
    if (!(element instanceof HTMLElement)) {
      resolve();
      return;
    }
    const check = (e?: TransitionEvent) => {
      // Don't trigger on bubbled events
      if (e && e.target !== element) {
        return;
      }

      if (e && propertyName && e.propertyName !== propertyName) {
        return;
      }

      element.removeEventListener('transitionend', check);
      if (timeout) {
        clearTimeout(timeout);
      }
      resolve();
    };

    element.addEventListener('transitionend', check);

    if (expectImmediate) {
      timeout = window.setTimeout(
        check,
        domTransitionDuration(element, propertyName),
      );
    }
  });
}

/**
 * Get the duration of a CSS transition for an element. If no propertyName is given,
 * return the first found transition property.
 *
 * @param element
 * @param propertyName
 * @returns duration in ms
 */
export function domTransitionDuration(
  element: HTMLElement,
  propertyName?: string,
) {
  // Get list of durations, one duration for each property
  const style = window.getComputedStyle(element);
  const durations = style.transitionDuration?.trim().split(/\s*,\s/) ?? [];
  const delays = style.transitionDelay?.trim().split(/\s*,\s/) ?? [];
  let propertyIndex = 0;

  if (propertyName) {
    const propertyNames =
      style.transitionProperty?.trim().split(/\s*,\s/) ?? [];
    propertyIndex = propertyNames.indexOf(propertyName);
    if (propertyIndex < 0) {
      // The best way to fail is to use the first available property
      propertyIndex = 0;
    }
  }

  const delayString = delays[propertyIndex];
  let delay = 0;
  if (delayString) {
    if (delayString.indexOf('ms') >= 0) {
      delay = Number.parseFloat(delayString);
    } else {
      delay = Number.parseFloat(delayString) * 1000;
    }
    if (Number.isNaN(delay)) {
      delay = 0;
    }
  }

  const durationString = durations[propertyIndex];
  let duration = 0;
  if (durationString) {
    if (durationString.indexOf('ms') >= 0) {
      duration = Number.parseFloat(durationString);
    } else {
      duration = Number.parseFloat(durationString) * 1000;
    }
    if (Number.isNaN(duration)) {
      duration = 0;
    }
  }

  return delay + duration;
}
