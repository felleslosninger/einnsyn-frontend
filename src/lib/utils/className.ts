type ClassName =
  | undefined
  | string
  | {
    [name: string]: boolean;
  };

/**
 * Add optional classnames to element class.
 *
 * @param  {ClassName[]} args
 * @return {string}
 */
export default function cn(...args: ClassName[]): string {
  const classNames: { [key: string]: boolean } = {};

  for (const arg of args) {
    // Add classNames from strings, whitespace-separated
    if (typeof arg === 'string') {
      const newArgs = arg.trim().split(/\s+/);
      for (const newArg of newArgs) {
        classNames[newArg] = true;
      }
    }

    // Add classNames from object
    else if (typeof arg === 'object') {
      for (const key in arg) {
        classNames[key] = !!arg[key];
      }
    }
  }

  return Object.keys(classNames)
    .filter((v) => v !== '') // Remove empty strings
    .filter((v) => v ?? false) // Remove undefined / null
    .filter((v) => classNames[v]) // Remove specified false
    .sort()
    .join(' ');
}
