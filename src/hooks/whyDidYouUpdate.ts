import { useEffect, useRef } from 'react';

export function useWhyDidYouUpdate(
  name: string,
  props: Record<string, unknown>,
) {
  const previousProps = useRef<Record<string, unknown>>({});

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changesObj: Record<string, { from: unknown; to: unknown }> = {};
      allKeys.forEach((key) => {
        if (
          previousProps.current &&
          previousProps.current[key] !== props[key]
        ) {
          changesObj[key] = {
            from: previousProps.current[key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changesObj).length) {
        console.log('[why-did-you-update]', name, changesObj);
      }
    }
    previousProps.current = props;
  });
}
