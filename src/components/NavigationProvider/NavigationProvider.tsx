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
  type?: 'push' | 'replace' | 'refresh' | 'native'; // Native for browser back/forward
  loadingPathname?: string;
  loadingSearchParamsString?: string;
  loadingOptions?: NavigateOptions;
};

type NavigationContextValue = {
  state: NavigationState['state'];
  pathname: string;
  searchParams: URLSearchParams;
  searchParamsString: string;
  loadingPathname: string | undefined;
  loadingSearchParams: URLSearchParams | undefined;
  loadingSearchParamsString: string | undefined;
  optimisticPathname: string;
  optimisticSearchParams: URLSearchParams;
  optimisticSearchParamsString: string;
  loading: boolean;
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
  const navigationStartedRef = useRef(false);

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
      setNavigationState({
        state: 'loading',
        loadingPathname: window.location.pathname,
        loadingSearchParamsString: new URLSearchParams(
          window.location.search,
        ).toString(),
        type: 'native',
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
      const url = new URL(window.location.origin);
      url.pathname = loadingPathname;
      url.search = loadingSearchParams?.toString() ?? '';

      startTransition(() => {
        if (type === 'push') {
          router.push(url.href, loadingOptions);
        } else if (type === 'replace') {
          router.replace(url.href, loadingOptions);
        }
      });
    }
  }, [navigationState, router, loadingSearchParams]);

  // Track whether a transition has actually started before allowing loading
  // state to settle from `isPending`.
  useEffect(() => {
    if (navigationState.state !== 'loading') {
      navigationStartedRef.current = false;
      return;
    }

    if (isPending) {
      navigationStartedRef.current = true;
    }
  }, [navigationState.state, isPending]);

  // Detect when navigation is actually complete.
  useEffect(() => {
    if (navigationState.state !== 'loading') {
      return;
    }

    const targetSearchParamsString =
      navigationState.loadingSearchParamsString ?? '';
    const reachedTargetUrl =
      navigationState.loadingPathname !== undefined &&
      pathname === navigationState.loadingPathname &&
      searchParamsString === targetSearchParamsString;

    if (
      (navigationState.type === 'push' ||
        navigationState.type === 'replace' ||
        navigationState.type === 'native') &&
      reachedTargetUrl
    ) {
      setNavigationState({
        state: 'idle',
      });
      return;
    }

    if (
      navigationState.type === 'refresh' &&
      navigationStartedRef.current &&
      !isPending
    ) {
      setNavigationState({
        state: 'idle',
      });
    }
  }, [navigationState, pathname, searchParamsString, isPending]);

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
    setNavigationState({
      state: 'loading',
      type: 'native',
    });
    startTransition(() => {
      router.back();
    });
  }, [router]);

  const forward = useCallback(() => {
    setNavigationState({
      state: 'loading',
      type: 'native',
    });
    startTransition(() => {
      router.forward();
    });
  }, [router]);

  const refresh = useCallback(() => {
    const { pathname: currentPathname, searchParams: currentSearchParams } =
      routeInfoRef.current;
    setNavigationState({
      state: 'loading',
      type: 'refresh',
      loadingPathname: currentPathname,
      loadingSearchParamsString: currentSearchParams.toString(),
    });
    startTransition(() => {
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
      searchParamsString,
      loadingPathname: navigationState.loadingPathname,
      loadingSearchParams,
      loadingSearchParamsString: navigationState.loadingSearchParamsString,
      optimisticPathname,
      optimisticSearchParams,
      optimisticSearchParamsString:
        navigationState.loadingSearchParamsString ?? searchParamsString,
      loading: navigationState.state === 'loading',
      push,
      replace,
      back,
      forward,
      refresh,
      prefetch,
    }),
    [
      navigationState.state,
      navigationState.loadingSearchParamsString,
      pathname,
      searchParams,
      searchParamsString,
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
  const {
    searchParams,
    searchParamsString,
    loadingSearchParams,
    loadingSearchParamsString,
    state,
  } = useNavigation();

  return state === 'loading' && loadingSearchParamsString !== searchParamsString
    ? loadingSearchParams
    : searchParams;
}
