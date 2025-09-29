'use client';

import type { NavigateOptions } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type React from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';

type NavigationState = {
  state: 'idle' | 'loading';
  type?: 'push' | 'replace' | 'native'; // Native for browser back/forward
  loadingPathname?: string;
  loadingSearchParamsString?: string;
  loadingOptions?: NavigateOptions;
};

type NavigationContextValue = {
  state: NavigationState['state'];
  pathname: string;
  searchParams: URLSearchParams;
  loadingPathname: string | undefined;
  loadingSearchParams: URLSearchParams | undefined;
  optimisticPathname: string;
  optimisticSearchParams: URLSearchParams;
  // Navigation methods
  push: (href: string, options?: NavigateOptions) => void;
  replace: (href: string, options?: NavigateOptions) => void;
  back: () => void;
  forward: () => void;
  refresh: () => void;
  prefetch: (href: string) => void;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

type NavigationProviderProps = {
  children: React.ReactNode;
};

export function NavigationProvider({ children }: NavigationProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const [isPending, startTransition] = useTransition();
  const [navigationState, setNavigationState] = useState<NavigationState>({
    state: 'idle',
  });

  const loadingSearchParams = useMemo(() => {
    return navigationState.loadingSearchParamsString
      ? new URLSearchParams(navigationState.loadingSearchParamsString)
      : undefined;
  }, [navigationState.loadingSearchParamsString]);

  const optimisticPathname = navigationState.loadingPathname ?? pathname;
  const optimisticSearchParams = useMemo(
    () => loadingSearchParams ?? new URLSearchParams(searchParamsString),
    [loadingSearchParams, searchParamsString],
  );

  // Keep pathname and searchParams in a ref to make callbacks stable
  const routeInfoRef = useRef({ pathname, searchParams });
  useEffect(() => {
    routeInfoRef.current = { pathname, searchParams };
  }, [pathname, searchParams]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      // When popstate fires, the URL has already changed.
      startTransition(() => {
        setNavigationState({
          state: 'loading',
          loadingPathname: window.location.pathname,
          loadingSearchParamsString: window.location.search,
          type: 'native',
        });
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Trigger actual navigation
  useEffect(() => {
    const { state, loadingPathname, loadingOptions, type } = navigationState;
    if (
      state === 'loading' &&
      type !== 'native' &&
      loadingPathname !== undefined
    ) {
      startTransition(() => {
        const url = new URL(window.location.origin);
        url.pathname = loadingPathname;
        url.search = loadingSearchParams?.toString() ?? '';

        if (type === 'push') {
          router.push(url.href, loadingOptions);
        } else if (type === 'replace') {
          router.replace(url.href, loadingOptions);
        }
      });
    }
  }, [navigationState, router, loadingSearchParams]);

  // Detect when any navigation is complete
  useEffect(() => {
    if (!isPending) {
      setNavigationState({
        state: 'idle',
      });
    }
  }, [isPending]);

  const callPushOrReplace = useCallback(
    (type: 'replace' | 'push', href: string, options?: NavigateOptions) => {
      const url = new URL(href, window.location.origin);
      const newSearchParams = new URLSearchParams(url.search);
      const newSearchParamsString = newSearchParams.toString();
      const { pathname: currentPathname, searchParams: currentSearchParams } =
        routeInfoRef.current;

      if (
        url.pathname === currentPathname &&
        newSearchParamsString === currentSearchParams.toString()
      ) {
        return;
      }

      setNavigationState({
        state: 'loading',
        type,
        loadingPathname: url.pathname,
        loadingSearchParamsString: newSearchParamsString,
        loadingOptions: options,
      });
    },
    [],
  );

  // Wrapped navigation methods that track loading state
  const push = useCallback(
    (href: string, options?: NavigateOptions) => {
      callPushOrReplace('push', href, options);
    },
    [callPushOrReplace],
  );

  const replace = useCallback(
    (href: string, options?: NavigateOptions) => {
      callPushOrReplace('replace', href, options);
    },
    [callPushOrReplace],
  );

  const back = useCallback(() => {
    startTransition(() => {
      setNavigationState({
        state: 'loading',
        type: 'native',
      });
      router.back();
    });
  }, [router]);

  const forward = useCallback(() => {
    startTransition(() => {
      setNavigationState({
        state: 'loading',
        type: 'native',
      });
      router.forward();
    });
  }, [router]);

  const refresh = useCallback(() => {
    startTransition(() => {
      const { pathname: currentPathname, searchParams: currentSearchParams } =
        routeInfoRef.current;
      setNavigationState({
        state: 'loading',
        type: 'replace',
        loadingPathname: currentPathname,
        loadingSearchParamsString: currentSearchParams.toString(),
      });
      router.refresh();
    });
  }, [router]);

  const prefetch = useCallback(
    (href: string) => {
      router.prefetch(href);
    },
    [router],
  );

  const value = useMemo(
    () => ({
      state: navigationState.state,
      pathname,
      searchParams,
      loadingPathname: navigationState.loadingPathname,
      loadingSearchParams,
      optimisticPathname,
      optimisticSearchParams,
      push,
      replace,
      back,
      forward,
      refresh,
      prefetch,
    }),
    [
      navigationState.state,
      pathname,
      searchParams,
      navigationState.loadingPathname,
      loadingSearchParams,
      optimisticPathname,
      optimisticSearchParams,
      push,
      replace,
      back,
      forward,
      refresh,
      prefetch,
    ],
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

// Hook to use navigation context
export function useNavigation() {
  const context = useContext(NavigationContext);

  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }

  return context;
}

// Convenience hook to get current or loading pathname
export function useOptimisticPathname() {
  const { pathname, loadingPathname, state } = useNavigation();
  return state === 'loading' && loadingPathname ? loadingPathname : pathname;
}

// Convenience hook to get current or loading search params
export function useOptimisticSearchParams() {
  const { searchParams, loadingSearchParams, state } = useNavigation();

  return state === 'loading' && loadingSearchParams
    ? loadingSearchParams
    : searchParams;
}
