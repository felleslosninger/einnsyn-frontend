'use client';

import type { NavigateOptions } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import {
  usePathname,
  useRouter,
  useSearchParams,
  useSelectedLayoutSegments,
} from 'next/navigation';
import type React from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import { getSection, isModalSection } from '~/lib/routing/sections';

type NavigationState = {
  state: 'idle' | 'loading';
  type?: 'push' | 'replace' | 'refresh' | 'native'; // Native for browser back/forward
  loadingPathname?: string;
  loadingSearchParamsString?: string;
  loadingOptions?: NavigateOptions;
};

/**
 * Everything but `modalOpen` and `closeModal` describes the page: while a
 * modal (app/@modal) is open, the page behind it rather than the browser URL.
 */
type NavigationContextValue = {
  state: NavigationState['state'];
  href: string;
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
  modalOpen: boolean;
  // Navigation methods
  push: (href: string, options?: NavigateOptions) => void;
  replace: (href: string, options?: NavigateOptions) => void;
  back: () => void;
  forward: () => void;
  refresh: () => void;
  prefetch: (href: string) => void;
  closeModal: () => void;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

type NavigationProviderProps = {
  children: React.ReactNode;
};

function toHref(pathname: string, searchParamsString: string) {
  return searchParamsString ? `${pathname}?${searchParamsString}` : pathname;
}

// The inverse of `toHref`: a pathname never contains `?`.
function splitHref(href: string) {
  const index = href.indexOf('?');
  return index === -1
    ? { pathname: href, searchParamsString: '' }
    : {
        pathname: href.slice(0, index),
        searchParamsString: href.slice(index + 1),
      };
}

function loadingTarget(href: string) {
  const { pathname, searchParamsString } = splitHref(href);
  return {
    loadingPathname: pathname,
    loadingSearchParamsString: searchParamsString,
  };
}

/**
 * The current history entry, the page under it (itself, or the page a modal
 * opened over) and how many entries back that page is: 0 for a page, null
 * when the page has no entry (a direct link, or a modal that replaced it).
 */
type HistoryEntry = { href: string; pageHref: string; depth: number | null };

// With no page known behind it, a modal opens over the front page.
function entryOf(href: string, modal: boolean): HistoryEntry {
  return modal
    ? { href, pageHref: '/', depth: null }
    : { href, pageHref: href, depth: 0 };
}

// A modal's page and depth go into its `history.state`, so back/forward finds
// them, also after a reload.
const MODAL_STAMP_KEY = '__einModal';

export function NavigationProvider({ children }: NavigationProviderProps) {
  const router = useRouter();
  const browserHref = toHref(usePathname(), useSearchParams().toString());
  // Modal pages live in the `(modal)` route group. Next puts an internal
  // `(__SLOT__)` segment first, so look for the group anywhere.
  const modalOpen = useSelectedLayoutSegments('modal').includes('(modal)');
  const [historyEntry, setHistoryEntry] = useState(() =>
    entryOf(browserHref, modalOpen),
  );
  const [isPending, startTransition] = useTransition();
  const [navigationState, setNavigationState] = useState<NavigationState>({
    state: 'idle',
  });
  const navigationStartedRef = useRef(false);
  const pendingTypeRef = useRef<'push' | 'replace' | undefined>(undefined);
  const closingModalRef = useRef(false);

  // In the render that opens a modal, `historyEntry` is still the page's
  // own, so `historyEntry.pageHref` is the page it opens over.
  const pageHref = modalOpen ? historyEntry.pageHref : browserHref;
  const { pathname: pagePathname, searchParamsString: pageSearchParamsString } =
    splitHref(pageHref);
  const pageSearchParams = useMemo(
    () => new URLSearchParams(pageSearchParamsString),
    [pageSearchParamsString],
  );

  const loadingSearchParams = useMemo(() => {
    return navigationState.loadingSearchParamsString !== undefined
      ? new URLSearchParams(navigationState.loadingSearchParamsString)
      : undefined;
  }, [navigationState.loadingSearchParamsString]);

  const optimisticPathname = navigationState.loadingPathname ?? pagePathname;
  const optimisticSearchParams = useMemo(
    () => loadingSearchParams ?? new URLSearchParams(pageSearchParamsString),
    [loadingSearchParams, pageSearchParamsString],
  );

  // Keep the latest values in a ref to make callbacks stable
  const latestRef = useRef({ browserHref, pageHref, historyEntry });
  useLayoutEffect(() => {
    latestRef.current = { browserHref, pageHref, historyEntry };
  });

  // Record each committed URL. Back/forward already moved to its entry.
  useLayoutEffect(() => {
    const type = pendingTypeRef.current;
    pendingTypeRef.current = undefined;
    closingModalRef.current = false;

    const previous = latestRef.current.historyEntry;
    if (previous.href === browserHref) {
      return;
    }

    let entry = entryOf(browserHref, false);
    if (modalOpen) {
      const { depth } = previous;
      if (type === 'replace') {
        // Replacing the page itself leaves no entry to go back to
        entry = {
          href: browserHref,
          pageHref: previous.pageHref,
          depth: depth === 0 ? null : depth,
        };
      } else {
        entry = {
          href: browserHref,
          pageHref: previous.pageHref,
          depth: depth === null ? null : depth + 1,
        };
      }
    }
    latestRef.current.historyEntry = entry;
    setHistoryEntry(entry);
  }, [browserHref, modalOpen]);

  // Stamp a modal's entry, again whenever Next has replaced the state.
  useLayoutEffect(() => {
    const entry = latestRef.current.historyEntry;
    const stamp = window.history.state?.[MODAL_STAMP_KEY];
    if (
      entry.href !== entry.pageHref && // Modal is open
      (stamp?.pageHref !== entry.pageHref || // New page behind it
        stamp?.depth !== entry.depth) // New depth
    ) {
      window.history.replaceState(
        {
          ...window.history.state,
          [MODAL_STAMP_KEY]: { pageHref: entry.pageHref, depth: entry.depth },
        },
        '',
      );
    }
  });

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const { pathname, search } = window.location;
      const href = toHref(pathname, new URLSearchParams(search).toString());
      const stamp = event.state?.[MODAL_STAMP_KEY];
      const entry: HistoryEntry = stamp
        ? { href, pageHref: stamp.pageHref, depth: stamp.depth }
        : entryOf(href, isModalSection(getSection(pathname)));
      latestRef.current.historyEntry = entry;
      setHistoryEntry(entry);

      // Going back or forward to a modal leaves the page behind it in place.
      setNavigationState(
        entry.pageHref === latestRef.current.pageHref
          ? { state: 'idle' }
          : {
              state: 'loading',
              type: 'native',
              ...loadingTarget(entry.pageHref),
            },
      );
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
      pagePathname === navigationState.loadingPathname &&
      pageSearchParamsString === targetSearchParamsString;

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
  }, [navigationState, pagePathname, pageSearchParamsString, isPending]);

  const callPushOrReplace = useCallback(
    (type: 'replace' | 'push', href: string, options?: NavigateOptions) => {
      const url = new URL(href, window.location.origin);
      const target = toHref(
        url.pathname,
        new URLSearchParams(url.search).toString(),
      );
      if (target === latestRef.current.browserHref) {
        return;
      }

      pendingTypeRef.current = type;
      if (isModalSection(getSection(url.pathname))) {
        // A modal opens over the page, so the page is not loading.
        setNavigationState({ state: 'idle' });
        startTransition(() => {
          router[type](target, { ...options, scroll: false });
        });
        return;
      }

      setNavigationState({
        state: 'loading',
        type,
        ...loadingTarget(target),
        loadingOptions: options,
      });
    },
    [router],
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

  // The popstate handler sets the loading state, once it knows the target.
  const back = useCallback(() => {
    startTransition(() => {
      router.back();
    });
  }, [router]);

  const forward = useCallback(() => {
    startTransition(() => {
      router.forward();
    });
  }, [router]);

  const refresh = useCallback(() => {
    setNavigationState({
      state: 'loading',
      type: 'refresh',
      ...loadingTarget(latestRef.current.pageHref),
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

  const closeModal = useCallback(() => {
    const entry = latestRef.current.historyEntry;
    // Only from a modal's entry, and once: going back twice would go too far.
    if (entry.href === entry.pageHref || closingModalRef.current) {
      return;
    }
    closingModalRef.current = true;

    if (entry.depth === null) {
      callPushOrReplace('replace', entry.pageHref, { scroll: false });
    } else {
      // Going back restores the page from the client cache, without a request.
      window.history.go(-entry.depth);
    }
  }, [callPushOrReplace]);

  const value = useMemo(
    () => ({
      state: navigationState.state,
      href: pageHref,
      pathname: pagePathname,
      searchParams: pageSearchParams,
      searchParamsString: pageSearchParamsString,
      loadingPathname: navigationState.loadingPathname,
      loadingSearchParams,
      loadingSearchParamsString: navigationState.loadingSearchParamsString,
      optimisticPathname,
      optimisticSearchParams,
      optimisticSearchParamsString:
        navigationState.loadingSearchParamsString ?? pageSearchParamsString,
      loading: navigationState.state === 'loading',
      modalOpen,
      push,
      replace,
      back,
      forward,
      refresh,
      prefetch,
      closeModal,
    }),
    [
      navigationState.state,
      navigationState.loadingSearchParamsString,
      pageHref,
      pagePathname,
      pageSearchParams,
      pageSearchParamsString,
      navigationState.loadingPathname,
      loadingSearchParams,
      optimisticPathname,
      optimisticSearchParams,
      modalOpen,
      push,
      replace,
      back,
      forward,
      refresh,
      prefetch,
      closeModal,
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
