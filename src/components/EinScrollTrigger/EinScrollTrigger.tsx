import React, { useEffect, useRef } from 'react';
import useIsMounted from '~/hooks/useIsMounted';

type EinScrollTriggerProps = {
  onEnter: () => void;
  onExit?: () => void;
  rootMargin?: string;
  children?: React.ReactNode;
};

export const EinScrollTrigger = ({
  onEnter,
  onExit,
  rootMargin,
  children,
}: EinScrollTriggerProps) => {
  const elementRef = useRef(null);
  const hasEnteredRef = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          hasEnteredRef.current = true;
          onEnter();
        } else if (hasEnteredRef.current && onExit) {
          onExit();
        }
      },
      {
        rootMargin: rootMargin ?? '50%',
      },
    );
    const element = elementRef.current;
    if (element) {
      observer.observe(element);
      return () => {
        if (element) observer.unobserve(element);
      };
    }
  }, [onEnter, onExit, rootMargin]);

  return <div ref={elementRef}>{children}</div>;
};
