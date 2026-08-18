'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { VListHandle } from 'virtua';
import { useEnhetCache } from '~/components/EnhetCacheProvider/EnhetCacheProvider';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import { useEnhetFilterIds } from '~/hooks/useEnhetFilterIds';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import {
  getEnhetIdentifier,
  getName,
  type TrimmedEnhet,
} from '~/lib/utils/enhetUtils';
import { addParamListValue, removeParamListValue } from '~/lib/utils/paramList';
import { buildEnhetSelectionHref } from '~/lib/utils/searchHref';
import { type EnhetNode, filterEnhetList } from './enhetSearch';
import { useResolvedEnhetMap } from './useResolvedEnhetMap';

export type EnhetSelectorFocus = {
  list: 'available' | 'selected';
  index: number;
};

export type UseEnhetSelectorStateOptions = {
  active: boolean;
  close: () => void;
  isMobileLayout: boolean;
};

/**
 * The full state machine behind the EnhetSelector: parses the URL, owns the
 * filter input and keyboard focus, derives the available/selected lists, and
 * commits changes back to the URL.
 *
 * Desktop buffers selection changes until "Bruk valg" is clicked. Mobile
 * commits every change immediately. The view layer is layout-agnostic — it
 * just calls `addEnhet` / `removeEnhet` / `applySelection`.
 */
export function useEnhetSelectorState({
  active,
  close,
  isMobileLayout,
}: UseEnhetSelectorStateOptions) {
  const t = useTranslation();
  const languageCode = useLanguageCode();
  const searchPathname = `/${t('routing.searchPath')}`;
  const navigation = useNavigation();
  const { optimisticSearchParams, optimisticPathname } = navigation;

  const {
    enhetMap: rawEnhetMap,
    fullListLoaded,
    ensureFullList,
  } = useEnhetCache();
  const { enhetMap, enhetList } = useResolvedEnhetMap(rawEnhetMap);

  //
  // Refs
  //
  const inputRef = useRef<HTMLInputElement>(null);
  const availableListRef = useRef<VListHandle>(null);
  const selectedListRef = useRef<VListHandle>(null);

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  //
  // Selection: URL-backed, with a desktop "draft" buffer that only commits on
  // Apply.
  //
  const {
    pathEnhetValue,
    selectedEnhetIdentifiers: urlSelectedEnhetIdentifiers,
  } = useEnhetFilterIds(enhetMap);

  const isBuffered = !isMobileLayout && active;
  const [draftSelectedIdentifiers, setDraftSelectedIdentifiers] = useState<
    string[]
  >([]);

  // Re-seed the draft from the URL whenever the desktop modal opens. URL
  // changes mid-open are intentionally not synced — the user is editing.
  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-init on transition into buffered mode.
  useEffect(() => {
    if (isBuffered) {
      setDraftSelectedIdentifiers(urlSelectedEnhetIdentifiers);
    }
  }, [isBuffered]);

  const selectedEnhetIdentifiers = isBuffered
    ? draftSelectedIdentifiers
    : urlSelectedEnhetIdentifiers;

  const commitToUrl = useCallback(
    (next: string[]) => {
      navigation.replace(
        buildEnhetSelectionHref({
          pathname: optimisticPathname,
          searchPathname,
          searchParams: optimisticSearchParams,
          pathEnhetValue,
          selectedEnhetIdentifiers: next,
        }),
      );
    },
    [
      navigation,
      optimisticPathname,
      optimisticSearchParams,
      pathEnhetValue,
      searchPathname,
    ],
  );

  const setSelectedEnhetIdentifiers = useCallback(
    (next: string[]) => {
      if (isBuffered) {
        setDraftSelectedIdentifiers(next);
      } else {
        commitToUrl(next);
      }
    },
    [isBuffered, commitToUrl],
  );

  const applySelection = useCallback(() => {
    commitToUrl(draftSelectedIdentifiers);
    close();
  }, [commitToUrl, draftSelectedIdentifiers, close]);

  //
  // Derived: the resolved enhet objects behind the selected identifiers, plus
  // the values the summary buttons display.
  //
  const selectedEnheter = useMemo(() => {
    const result: TrimmedEnhet[] = [];
    for (const identifier of selectedEnhetIdentifiers) {
      const enhet = enhetMap.get(identifier);
      if (enhet) result.push(enhet);
    }
    return result;
  }, [enhetMap, selectedEnhetIdentifiers]);

  const selectedLabels = useMemo(
    () =>
      selectedEnhetIdentifiers.map((identifier) => {
        const enhet = enhetMap.get(identifier);
        return enhet ? getName(enhet, languageCode) : identifier;
      }),
    [enhetMap, languageCode, selectedEnhetIdentifiers],
  );

  const firstSelectedLabel = selectedLabels[0] ?? '';
  const additionalSelectedCount = Math.max(selectedLabels.length - 1, 0);
  const selectedSummary = useMemo(
    () => selectedLabels.join(', '),
    [selectedLabels],
  );
  const summaryLabel = firstSelectedLabel || t('search.enhetPlaceholder');

  //
  // Filter input + lazy load of the full enhet list on first open.
  //
  const [filterValue, setFilterValue] = useState('');

  useEffect(() => {
    if (active && !fullListLoaded) {
      ensureFullList();
    }
  }, [active, fullListLoaded, ensureFullList]);

  const onInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFilterValue(event.currentTarget.value);
    },
    [],
  );

  //
  // Add / remove / toggle / clear. All four go through
  // `setSelectedEnhetIdentifiers` so the buffered/unbuffered behavior stays in
  // one place.
  //
  const addEnhet = useCallback(
    (enhet: TrimmedEnhet, options?: { refocusInput?: boolean }) => {
      const next = addParamListValue(
        selectedEnhetIdentifiers,
        getEnhetIdentifier(enhet),
      );
      if (next !== selectedEnhetIdentifiers) {
        setSelectedEnhetIdentifiers(next);
      }
      if (options?.refocusInput !== false) focusInput();
    },
    [focusInput, selectedEnhetIdentifiers, setSelectedEnhetIdentifiers],
  );

  const removeEnhet = useCallback(
    (enhet: TrimmedEnhet, options?: { refocusInput?: boolean }) => {
      const next = removeParamListValue(
        selectedEnhetIdentifiers,
        getEnhetIdentifier(enhet),
      );
      if (next !== selectedEnhetIdentifiers) {
        setSelectedEnhetIdentifiers(next);
      }
      if (options?.refocusInput !== false) focusInput();
    },
    [focusInput, selectedEnhetIdentifiers, setSelectedEnhetIdentifiers],
  );

  const toggleEnhet = useCallback(
    (enhet: TrimmedEnhet) => {
      if (selectedEnhetIdentifiers.includes(getEnhetIdentifier(enhet))) {
        removeEnhet(enhet);
      } else {
        addEnhet(enhet);
      }
    },
    [addEnhet, removeEnhet, selectedEnhetIdentifiers],
  );

  const clearSelected = useCallback(() => {
    if (selectedEnhetIdentifiers.length === 0) return;
    setSelectedEnhetIdentifiers([]);
    setFocus(null);
    focusInput();
  }, [
    focusInput,
    selectedEnhetIdentifiers.length,
    setSelectedEnhetIdentifiers,
  ]);

  const removeSelectedAt = useCallback(
    (index: number) => {
      const identifier = selectedEnhetIdentifiers[index];
      if (!identifier) return;
      setSelectedEnhetIdentifiers(
        removeParamListValue(selectedEnhetIdentifiers, identifier),
      );
      focusInput();
    },
    [focusInput, selectedEnhetIdentifiers, setSelectedEnhetIdentifiers],
  );

  //
  // Derived list: filtered + sorted by score, then split into "selected" /
  // "available" buckets so the views can render them separately.
  //
  const enhetNodes: EnhetNode[] = useMemo(
    () =>
      enhetList.map((enhet) => ({
        currentName: getName(enhet, languageCode),
        enhet,
        score: enhet.enhetstype === 'DUMMYENHET' ? 0.5 : 1,
      })),
    [enhetList, languageCode],
  );

  const visibleNodes = useMemo(
    () => filterEnhetList(enhetNodes, filterValue, languageCode),
    [enhetNodes, filterValue, languageCode],
  );

  // - `availableNodes`: candidates the user can add (filtered, non-selected).
  //   Both layouts use these as the main list.
  // - `searchMatchedSelectedNodes`: selected enheter that *also* match the
  //   filter. Only the mobile sheet uses this — it pins them at the top
  //   under a "Valgte" header so users can find their selections in long
  //   lists. The desktop view uses `selectedEnheter` instead (all selected,
  //   unfiltered) for a stable manage-your-selection right column.
  const { searchMatchedSelectedNodes, availableNodes } = useMemo(() => {
    const selectedSet = new Set(selectedEnhetIdentifiers);
    const selected: EnhetNode[] = [];
    const available: EnhetNode[] = [];
    for (const node of visibleNodes) {
      if (selectedSet.has(getEnhetIdentifier(node.enhet))) {
        selected.push(node);
      } else {
        available.push(node);
      }
    }
    return { searchMatchedSelectedNodes: selected, availableNodes: available };
  }, [visibleNodes, selectedEnhetIdentifiers]);

  //
  // Keyboard navigation across the two lists.
  //
  const [focus, setFocus] = useState<EnhetSelectorFocus | null>(null);

  // Scroll the focused row into view whenever focus changes.
  useEffect(() => {
    if (!active || !focus) return;
    const listRef =
      focus.list === 'available' ? availableListRef : selectedListRef;
    listRef.current?.scrollToIndex(focus.index, { align: 'nearest' });
  }, [focus, active]);

  // If the available list shrinks below the focused index, clamp it.
  useEffect(() => {
    setFocus((prev) => {
      if (prev?.list !== 'available') return prev;
      if (availableNodes.length === 0) return null;
      const maxIndex = availableNodes.length - 1;
      return prev.index > maxIndex
        ? { list: 'available', index: maxIndex }
        : prev;
    });
  }, [availableNodes.length]);

  // Reset focus on filter or close.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on filter change only.
  useEffect(() => {
    setFocus(null);
    availableListRef.current?.scrollToIndex(0, { align: 'start' });
  }, [filterValue]);

  // Note: focusing the input on open is handled by the view's transition
  // events (EinPopup / EinModal `onEnterTransition`) rather than here —
  // the popup/sheet is `display: none` while the transition runs its init
  // pose, so .focus() would silently no-op if called from this effect.
  const previousActiveRef = useRef(active);
  useEffect(() => {
    const wasActive = previousActiveRef.current;
    if (!active && wasActive) {
      setFilterValue('');
      setFocus(null);
    }
    previousActiveRef.current = active;
  }, [active]);

  // Shared arrow/Enter/Escape navigation. Bound to the filter input and to
  // both listboxes — the listboxes themselves are tab stops, so they need to
  // handle keys when DOM focus lands on them. The handler reads `focus.list`,
  // which is kept in sync with DOM focus via `onListFocus` below.
  const onListNavKeyDown = useCallback(
    (event: React.KeyboardEvent<Element>) => {
      if (!active) return;

      // When triggered from a list, Enter shouldn't bounce DOM focus back to
      // the input — the user is navigating the list itself.
      const isFromInput = event.currentTarget === inputRef.current;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setFocus((prev) => {
            const list = prev?.list ?? 'available';
            const items =
              list === 'selected' ? selectedEnheter : availableNodes;
            if (items.length === 0) return null;
            return {
              list,
              index: Math.min((prev?.index ?? -1) + 1, items.length - 1),
            };
          });
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocus((prev) => {
            const list = prev?.list ?? 'available';
            const items =
              list === 'selected' ? selectedEnheter : availableNodes;
            if (items.length === 0) return null;
            return { list, index: Math.max((prev?.index ?? 0) - 1, 0) };
          });
          break;
        case 'Enter':
          event.preventDefault();
          if (!focus) break;
          if (focus.list === 'available') {
            const node = availableNodes[focus.index];
            if (node) addEnhet(node.enhet, { refocusInput: isFromInput });
          } else {
            const enhet = selectedEnheter[focus.index];
            if (enhet) removeEnhet(enhet, { refocusInput: isFromInput });
          }
          break;
        case 'Escape':
          event.preventDefault();
          if (focus) {
            setFocus(null);
            if (!isFromInput) inputRef.current?.focus();
          } else {
            close();
          }
          break;
      }
    },
    [
      active,
      addEnhet,
      availableNodes,
      close,
      focus,
      removeEnhet,
      selectedEnheter,
    ],
  );

  const onInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (!active) return;

      // Backspace on an empty input removes the last selected chip.
      if (event.key === 'Backspace') {
        const { selectionStart, selectionEnd, value } = event.currentTarget;
        if (
          selectionStart === 0 &&
          selectionEnd === 0 &&
          value.length === 0 &&
          selectedEnhetIdentifiers.length > 0
        ) {
          event.preventDefault();
          removeSelectedAt(selectedEnhetIdentifiers.length - 1);
        }
        return;
      }

      onListNavKeyDown(event);
    },
    [
      active,
      onListNavKeyDown,
      removeSelectedAt,
      selectedEnhetIdentifiers.length,
    ],
  );

  // When the user tabs into a list, snap focus to the first row in that list
  // (or preserve the existing position if it's already in this list). The
  // role check filters out child focus events (e.g. clicking a row) so a
  // click on row N doesn't reset the highlight to row 0 before the click
  // handler runs.
  const onListFocus = useCallback(
    (event: React.FocusEvent, list: EnhetSelectorFocus['list']) => {
      if (
        !(event.target instanceof Element) ||
        event.target.getAttribute('role') !== 'listbox'
      ) {
        return;
      }
      setFocus((prev) => (prev?.list === list ? prev : { list, index: 0 }));
    },
    [],
  );

  const focusedOptionId = useMemo(() => {
    if (!focus) return undefined;
    if (focus.list === 'available') {
      const node = availableNodes[focus.index];
      return node ? `enhet-option-available-${node.enhet.id}` : undefined;
    }
    const enhet = selectedEnheter[focus.index];
    return enhet ? `enhet-option-selected-${enhet.id}` : undefined;
  }, [focus, availableNodes, selectedEnheter]);

  return {
    // Refs
    inputRef,
    availableListRef,
    selectedListRef,
    focusInput,

    // Filter input
    filterValue,
    onInputChange,
    onInputKeyDown,

    // List keyboard handlers (bound to the VLists themselves so Tab can
    // move focus into a list and keyboard nav continues working there)
    onListNavKeyDown,
    onListFocus,

    // Summary data
    summaryLabel,
    additionalSelectedCount,
    selectedSummary,
    hasSelection: selectedEnhetIdentifiers.length > 0,

    // Lists
    availableNodes,
    searchMatchedSelectedNodes,
    selectedEnheter,
    fullListLoaded,

    // Focus state
    focus,
    focusedOptionId,

    // Selection actions
    addEnhet,
    removeEnhet,
    toggleEnhet,
    clearSelected,
    applySelection,
  };
}

export type EnhetSelectorState = ReturnType<typeof useEnhetSelectorState>;
