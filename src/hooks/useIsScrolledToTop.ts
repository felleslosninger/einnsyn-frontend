import { useEffect, useLayoutEffect, useState } from 'react';

/**
 * Hook returning true if the page is scrolled to top (scrollY === 0), false otherwise.
 */
export function useIsScrolledToTop(): boolean {
  const [isTop, setIsTop] = useState<boolean>(true);

  // Set initial state (before paint)
  useLayoutEffect(() => {
    setIsTop(window.pageYOffset === 0);
  }, []);

  // Update on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsTop(window.pageYOffset === 0);
    };
    window.addEventListener('scroll', handleScroll); //, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return isTop;
}
