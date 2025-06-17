import React, { useEffect, useRef } from 'react';

type EinScrollTriggerProps = {
  onEnter: () => void;
  rootMargin?: string;
};

export const EinScrollTrigger = ({
  onEnter,
  rootMargin,
}: EinScrollTriggerProps) => {
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onEnter();
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
  }, [onEnter, rootMargin]);

  return <div ref={elementRef} style={{ width: 0, height: 0 }} />;
};
