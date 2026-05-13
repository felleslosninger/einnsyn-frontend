'use client';

import {
  Button,
  Heading,
  Search,
  Skeleton,
} from '@digdir/designsystemet-react';
import { Buildings3Icon } from '@navikt/aksel-icons';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { VList, type VListHandle } from 'virtua';
import EinModal, { EinModalHeader } from '~/components/EinModal/EinModal';
import EinPopup from '~/components/EinPopup/EinPopup';
import { useEnhetCache } from '~/components/EnhetCacheProvider/EnhetCacheProvider';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import useBreakpoint from '~/hooks/useBreakpoint';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { getEnhetHref, getName } from '~/lib/utils/enhetUtils';
import { skeletonString } from '~/lib/utils/skeletonUtils';
import type { TrimmedEnhet } from '~/lib/utils/trimmedEnhetUtils';
import styles from './EnhetSelector.module.scss';
import { EnhetSelectorSelectItem } from './EnhetSelectorSelectItem';
import { type EnhetNode, filterEnhetList } from './enhetSearch';
import {
  addEnhetId,
  normalizeEnhetParamValues,
  parseEnhetParam,
  removeEnhetId,
  serializeEnhetParam,
} from './enhetTokenInputUtils';

export default function EnhetSelector({
  className,
  active = false,
  activate,
  close,
}: {
  className?: string;
  active?: boolean;
  activate?: () => void;
  close?: () => void;
}) {
  const languageCode = useLanguageCode();
  const t = useTranslation();
  const navigation = useNavigation();
  const isMobileLayout = useBreakpoint('SM');
  const { optimisticSearchParams, optimisticPathname } = navigation;
  const enhetSearchQuery = optimisticSearchParams?.get('enhet') ?? '';
  const {
    enhetMap: rawEnhetMap,
    fullListLoaded,
    ensureFullList,
  } = useEnhetCache();
  const [filterValue, setFilterValue] = useState('');
  const [focus, setFocus] = useState<{
    list: 'available' | 'selected';
    index: number;
  } | null>(null);

  // Resolve parent references into Enhet objects for ancestor rendering.
  // Keep the old cutoff behavior: a parent may exist in the cache for lookup,
  // but its own top-level parent is intentionally not attached.
  const { enhetList, enhetMap } = useMemo(() => {
    const rawEnhetById = new Map<string, TrimmedEnhet>();
    for (const enhet of rawEnhetMap.values()) {
      rawEnhetById.set(enhet.id, enhet);
    }

    const resolvedById = new Map<string, TrimmedEnhet>();
    const resolveEnhet = (id: string): TrimmedEnhet | undefined => {
      const existing = resolvedById.get(id);
      if (existing) {
        return existing;
      }
      const enhet = rawEnhetById.get(id);
      if (!enhet) {
        return undefined;
      }

      let parent: TrimmedEnhet | undefined;
      if (typeof enhet.parent === 'string') {
        const rawParent = rawEnhetById.get(enhet.parent);
        if (rawParent?.parent) {
          parent = resolveEnhet(rawParent.id);
        }
      } else if (enhet.parent?.parent) {
        parent = enhet.parent;
      }

      const resolvedEnhet = Object.freeze({
        ...enhet,
        parent,
      });
      resolvedById.set(id, resolvedEnhet);
      return resolvedEnhet;
    };

    const nextEnhetMap = new Map<string, TrimmedEnhet>();
    const nextEnhetList: TrimmedEnhet[] = [];
    for (const enhet of rawEnhetById.values()) {
      const resolvedEnhet = resolveEnhet(enhet.id);
      if (!resolvedEnhet) {
        continue;
      }
      nextEnhetMap.set(enhet.id, resolvedEnhet);
      const href = getEnhetHref(enhet);
      if (href !== enhet.id) {
        nextEnhetMap.set(href, resolvedEnhet);
      }
      if (enhet.parent) {
        nextEnhetList.push(resolvedEnhet);
      }
    }
    return { enhetList: nextEnhetList, enhetMap: nextEnhetMap };
  }, [rawEnhetMap]);

  const containerRef = useRef<HTMLDivElement>(null);
  const summaryButtonRef = useRef<HTMLButtonElement>(null);
  const searchFieldRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const availableListRef = useRef<VListHandle>(null);
  const selectedListRef = useRef<VListHandle>(null);
  const previousExpandedRef = useRef(active);

  const selectedEnhetQueryValues = useMemo(
    () => parseEnhetParam(enhetSearchQuery),
    [enhetSearchQuery],
  );
  const selectedEnhetIds = useMemo(
    () =>
      normalizeEnhetParamValues(
        selectedEnhetQueryValues.map((value) => {
          const enhet = enhetMap.get(value);
          return enhet ? getEnhetHref(enhet) : value;
        }),
      ),
    [enhetMap, selectedEnhetQueryValues],
  );

  const setSelectedEnhetIds = useCallback(
    (nextSelectedEnhetIds: string[]) => {
      const newSearchParams = new URLSearchParams(
        optimisticSearchParams.toString(),
      );
      newSearchParams.delete('enhet');

      const enhetParam = serializeEnhetParam(nextSelectedEnhetIds);
      if (enhetParam.length > 0) {
        newSearchParams.set('enhet', enhetParam);
      }

      navigation.replace(`${optimisticPathname}?${newSearchParams.toString()}`);
    },
    [navigation, optimisticPathname, optimisticSearchParams],
  );

  const selectedEnhetList = useMemo(() => {
    return selectedEnhetIds.map((id) => {
      const enhet = enhetMap.get(id);
      return {
        id,
        label: enhet ? getName(enhet, languageCode) : id,
        enhet,
      };
    });
  }, [enhetMap, languageCode, selectedEnhetIds]);

  const selectedEnhetItems = useMemo(() => {
    return selectedEnhetList
      .map((selectedEnhet) => selectedEnhet.enhet)
      .filter((enhet): enhet is TrimmedEnhet => enhet !== undefined);
  }, [selectedEnhetList]);
  const firstSelectedLabel = selectedEnhetList[0]?.label ?? '';
  const additionalSelectedCount = Math.max(selectedEnhetList.length - 1, 0);
  const selectedSummary = useMemo(
    () =>
      selectedEnhetList.map((selectedEnhet) => selectedEnhet.label).join(', '),
    [selectedEnhetList],
  );
  const summaryLabel = firstSelectedLabel || t('search.enhetPlaceholder');

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  const onSummaryMouseDown = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!active) {
        return;
      }

      event.preventDefault();
      focusInput();
    },
    [active, focusInput],
  );

  const onSummaryFocus = useCallback(
    (event: React.FocusEvent<HTMLButtonElement>) => {
      if (!isMobileLayout || active) {
        return;
      }

      event.stopPropagation();
    },
    [active, isMobileLayout],
  );

  const onSummaryClick = useCallback(() => {
    activate?.();
    focusInput();
  }, [focusInput, activate]);

  const removeSelectedEnhetAtIndex = useCallback(
    (chipIndex: number) => {
      const enhetId = selectedEnhetIds[chipIndex];
      if (!enhetId) {
        return;
      }

      const nextSelectedEnhetIds = removeEnhetId(selectedEnhetIds, enhetId);
      setSelectedEnhetIds(nextSelectedEnhetIds);
      focusInput();
    },
    [focusInput, selectedEnhetIds, setSelectedEnhetIds],
  );

  const clearSelectedEnheter = useCallback(() => {
    if (selectedEnhetIds.length === 0) {
      return;
    }

    setSelectedEnhetIds([]);
    setFocus(null);
    focusInput();
  }, [focusInput, selectedEnhetIds.length, setSelectedEnhetIds]);

  // Load the full list lazily on first expand.
  useEffect(() => {
    if (active && !fullListLoaded) {
      ensureFullList();
    }
  }, [active, fullListLoaded, ensureFullList]);

  const enhetNodeList: EnhetNode[] = useMemo(
    () =>
      enhetList.map((enhet) => ({
        currentName: getName(enhet, languageCode),
        enhet,
        score: enhet.enhetstype === 'DUMMYENHET' ? 0.5 : 1,
      })),
    [enhetList, languageCode],
  );

  useEffect(() => {
    const wasExpanded = previousExpandedRef.current;

    if (active && !wasExpanded) {
      focusInput();
    }

    if (!active && wasExpanded) {
      setFilterValue('');
      setFocus(null);
    }

    previousExpandedRef.current = active;
  }, [active, focusInput]);

  // Resolve the wrapping search field once on mount so EinPopup can clamp the
  // popup's inline bounds to it (preventing it from extending past the form
  // on the left).
  useLayoutEffect(() => {
    const selector = containerRef.current;
    if (!selector) {
      return;
    }
    const searchField = selector.closest(
      '[data-search-field-container="true"]',
    );
    searchFieldRef.current =
      searchField instanceof HTMLElement ? searchField : null;
  }, []);

  // On the landing page, push the popup's overflow past the home header so the
  // page layout expands to make room for it. No-op outside the landing page.
  useEffect(() => {
    const selector = containerRef.current;
    const popup = popupRef.current;
    if (!selector || !popup || !active || isMobileLayout) {
      return;
    }

    const pageRoot = selector.closest('.einnsyn-body');
    const homeHeader = selector.closest('header.section-home');
    if (
      !(pageRoot instanceof HTMLElement) ||
      !(homeHeader instanceof HTMLElement)
    ) {
      return;
    }

    const resetOverflow = () => {
      pageRoot.style.removeProperty('--landing-page-selector-overflow');
    };

    const update = () => {
      const popupRect = popup.getBoundingClientRect();
      const homeHeaderRect = homeHeader.getBoundingClientRect();
      const overflow = Math.max(
        0,
        Math.ceil(popupRect.bottom - homeHeaderRect.bottom),
      );
      pageRoot.style.setProperty(
        '--landing-page-selector-overflow',
        `${overflow}px`,
      );
    };

    update();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => {
        window.removeEventListener('resize', update);
        resetOverflow();
      };
    }

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(popup);
    resizeObserver.observe(homeHeader);
    window.addEventListener('resize', update);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', update);
      resetOverflow();
    };
  }, [active, isMobileLayout]);

  const searchString = filterValue;

  // Get a sorted tree structure of enheter, filtered by search string
  const visibleEnhetNodeList: EnhetNode[] = useMemo(() => {
    return filterEnhetList(enhetNodeList, searchString, languageCode);
  }, [enhetNodeList, searchString, languageCode]);

  const addEnhetHandler = useCallback(
    (enhet: TrimmedEnhet) => {
      const nextSelectedEnhetIds = addEnhetId(
        selectedEnhetIds,
        getEnhetHref(enhet),
      );
      if (nextSelectedEnhetIds === selectedEnhetIds) {
        focusInput();
        return;
      }

      setSelectedEnhetIds(nextSelectedEnhetIds);
      focusInput();
    },
    [focusInput, selectedEnhetIds, setSelectedEnhetIds],
  );

  const removeEnhetHandler = useCallback(
    (enhet: TrimmedEnhet) => {
      const enhetIdentifier = getEnhetHref(enhet);
      const chipIndex = selectedEnhetIds.indexOf(enhetIdentifier);
      if (chipIndex < 0) {
        return;
      }

      removeSelectedEnhetAtIndex(chipIndex);
    },
    [removeSelectedEnhetAtIndex, selectedEnhetIds],
  );

  const toggleEnhetHandler = useCallback(
    (enhet: TrimmedEnhet) => {
      const enhetIdentifier = getEnhetHref(enhet);
      if (selectedEnhetIds.includes(enhetIdentifier)) {
        removeEnhetHandler(enhet);
      } else {
        addEnhetHandler(enhet);
      }
    },
    [addEnhetHandler, removeEnhetHandler, selectedEnhetIds],
  );

  const onInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFilterValue(event.currentTarget.value);
    },
    [],
  );

  const onInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      const {
        selectionStart = 0,
        selectionEnd = 0,
        value,
      } = event.currentTarget;

      if (event.key === 'Enter') {
        event.preventDefault();
        return;
      }

      if (
        event.key === 'Backspace' &&
        selectionStart === 0 &&
        selectionEnd === 0 &&
        value.length === 0 &&
        selectedEnhetList.length > 0
      ) {
        event.preventDefault();
        removeSelectedEnhetAtIndex(selectedEnhetList.length - 1);
      }
    },
    [removeSelectedEnhetAtIndex, selectedEnhetList.length],
  );

  useEffect(() => {
    if (!active || !focus) {
      return;
    }

    const listRef =
      focus.list === 'available' ? availableListRef : selectedListRef;
    listRef.current?.scrollToIndex(focus.index, { align: 'nearest' });
  }, [focus, active]);

  useEffect(() => {
    setFocus((prev) => {
      if (prev?.list !== 'available') {
        return prev;
      }
      if (visibleEnhetNodeList.length === 0) {
        return null;
      }
      const maxIndex = visibleEnhetNodeList.length - 1;
      return prev.index > maxIndex
        ? { list: 'available', index: maxIndex }
        : prev;
    });
  }, [visibleEnhetNodeList.length]);

  // Bound to the container via React's onKeyDown so events still reach us when
  // the mobile sheet is rendered through a portal (DOM-bound listeners would
  // miss those events; React synthetic events still bubble through the tree).
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!active) {
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setFocus((prev) => {
            const list = prev?.list ?? 'available';
            const items =
              list === 'selected' ? selectedEnhetItems : visibleEnhetNodeList;
            if (items.length === 0) {
              return null;
            }
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
              list === 'selected' ? selectedEnhetItems : visibleEnhetNodeList;
            if (items.length === 0) {
              return null;
            }
            return { list, index: Math.max((prev?.index ?? 0) - 1, 0) };
          });
          break;
        case 'Enter':
          if (!focus) {
            break;
          }
          event.preventDefault();
          if (focus.list === 'available') {
            const node = visibleEnhetNodeList[focus.index];
            if (node) {
              addEnhetHandler(node.enhet);
            }
          } else {
            const enhet = selectedEnhetItems[focus.index];
            if (enhet) {
              removeEnhetHandler(enhet);
            }
          }
          break;
        case 'Escape':
          event.preventDefault();
          if (focus) {
            setFocus(null);
            inputRef.current?.focus();
          } else {
            close?.();
          }
          break;
      }
    },
    [
      addEnhetHandler,
      active,
      focus,
      removeEnhetHandler,
      selectedEnhetItems,
      close,
      visibleEnhetNodeList,
    ],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: Reset focus state whenever the search string changes.
  useEffect(() => {
    setFocus(null);
    availableListRef.current?.scrollToIndex(0, { align: 'start' });
  }, [searchString]);

  const focusedOptionId = useMemo(() => {
    if (!focus) {
      return undefined;
    }
    if (focus.list === 'available') {
      const node = visibleEnhetNodeList[focus.index];
      return node ? `enhet-option-available-${node.enhet.id}` : undefined;
    }
    const enhet = selectedEnhetItems[focus.index];
    return enhet ? `enhet-option-selected-${enhet.id}` : undefined;
  }, [focus, visibleEnhetNodeList, selectedEnhetItems]);

  const renderSkeleton = (key: string) => {
    const name = skeletonString(10, 60);

    return (
      <div key={key} className={cn(styles.selectorListItem)}>
        <span className={styles.selectorListText}>
          <span>
            <Skeleton>{name}</Skeleton>
          </span>
        </span>
      </div>
    );
  };

  const handleSetOpen = useCallback(
    (value: boolean) => {
      if (!value) {
        close?.();
      }
    },
    [close],
  );

  const summaryButton = (
    <button
      ref={summaryButtonRef}
      type="button"
      className={cn(styles.summaryButton, {
        [styles.summaryButtonActive]: active,
      })}
      aria-label={selectedSummary || t('search.enhetPlaceholder')}
      aria-expanded={active}
      aria-haspopup="listbox"
      onClick={onSummaryClick}
      onFocus={onSummaryFocus}
      onMouseDown={onSummaryMouseDown}
    >
      <span className={cn(styles.summaryIcon)}>
        <Buildings3Icon
          className={cn(styles.searchIcon)}
          fontSize="1.2rem"
          aria-hidden="true"
        />
      </span>
      <span
        className={cn(styles.summaryText, {
          [styles.placeholderText]: selectedSummary.length === 0,
        })}
      >
        {summaryLabel}
      </span>

      {additionalSelectedCount > 0 && (
        <span className={styles.summaryMore} aria-hidden="true">
          +{additionalSelectedCount}
        </span>
      )}
    </button>
  );

  const filterField = (
    <div className={styles.filterField}>
      <Search>
        <Search.Input
          ref={inputRef}
          className={styles.filterFieldInput}
          value={filterValue}
          onChange={onInputChange}
          onKeyDown={onInputKeyDown}
          aria-label={t('search.enhetFilterPlaceholder')}
          aria-activedescendant={focusedOptionId}
          placeholder={t('search.enhetFilterPlaceholder')}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="none"
        />
        <Search.Clear aria-label={t('search.clear')} />
      </Search>
    </div>
  );

  const availableList = (
    <div className={styles.enhetSelectorDropdownListContainer}>
      <div className={styles.enhetSelectorDropdownLabelRow}>
        <Heading
          className={styles.enhetSelectorDropdownLabel}
          level={2}
          data-size="2xs"
        >
          {t('search.availableEnheter')} ({visibleEnhetNodeList.length})
        </Heading>
        {isMobileLayout && selectedEnhetIds.length > 0 && (
          <button
            type="button"
            className={styles.selectedListClearButton}
            onClick={clearSelectedEnheter}
          >
            {t('common.removeAll')}
          </button>
        )}
      </div>
      <VList
        ref={availableListRef}
        className={styles.enhetSelectorDropdownList}
        style={{ contain: 'content' }}
        aria-label={t('search.availableEnheter')}
        role="listbox"
      >
        {visibleEnhetNodeList.map((enhetNode, index) => {
          const isSelected = selectedEnhetIds.includes(
            getEnhetHref(enhetNode.enhet),
          );
          return (
            <EnhetSelectorSelectItem
              key={`add-${enhetNode.enhet.id}`}
              id={`enhet-option-available-${enhetNode.enhet.id}`}
              enhet={enhetNode.enhet}
              onClick={() =>
                isMobileLayout
                  ? toggleEnhetHandler(enhetNode.enhet)
                  : addEnhetHandler(enhetNode.enhet)
              }
              variant="available"
              actionLabel={
                isMobileLayout && isSelected
                  ? t('common.remove')
                  : t('common.add')
              }
              isSelected={isSelected}
              isFocused={focus?.list === 'available' && focus.index === index}
            />
          );
        })}
        {!fullListLoaded &&
          [0, 1, 2, 3].map((index) =>
            renderSkeleton(`loading-available-${index}`),
          )}
        {fullListLoaded && visibleEnhetNodeList.length === 0 && (
          <div className={styles.emptyState}>{t('common.noResults')}</div>
        )}
      </VList>
    </div>
  );

  const selectedList = (
    <div
      className={cn(
        styles.enhetSelectorDropdownListContainer,
        styles.selectedListContainer,
      )}
    >
      <div className={styles.enhetSelectorDropdownLabelRow}>
        <Heading
          className={styles.enhetSelectorDropdownLabel}
          level={2}
          data-size="2xs"
        >
          {t('search.selectedEnheter')}
        </Heading>
        {selectedEnhetIds.length > 0 && (
          <button
            type="button"
            className={styles.selectedListClearButton}
            onClick={clearSelectedEnheter}
          >
            {t('common.removeAll')}
          </button>
        )}
      </div>
      <VList
        ref={selectedListRef}
        className={styles.enhetSelectorDropdownList}
        aria-label={t('search.selectedEnheter')}
        role="listbox"
      >
        {selectedEnhetItems.map((enhet, index) => (
          <EnhetSelectorSelectItem
            key={`remove-${enhet.id}`}
            id={`enhet-option-selected-${enhet.id}`}
            enhet={enhet}
            onClick={() => removeEnhetHandler(enhet)}
            variant="selected"
            actionLabel={t('common.remove')}
            isFocused={focus?.list === 'selected' && focus.index === index}
          />
        ))}
      </VList>
    </div>
  );

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: keyboard handling delegates to the focused descendants (input, list buttons); this div only intercepts to enable list navigation across the portalled mobile sheet.
    <div
      className={cn(styles.enhetSelector, className)}
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.selectorField}>{summaryButton}</div>

      {isMobileLayout ? (
        <EinModal
          className={styles.mobileSheetModal}
          open={active}
          onClose={close}
        >
          <EinModalHeader title={t('search.enhetPlaceholder')} />
          {filterField}
          <div
            className={cn(styles.enhetSelectorDropdown, styles.mobileDropdown)}
          >
            {availableList}
          </div>
        </EinModal>
      ) : (
        <EinPopup
          open={active}
          setOpen={handleSetOpen}
          anchorRef={summaryButtonRef}
          sizeReferenceRef={searchFieldRef}
          popupRef={popupRef}
          className={styles.selectorPopup}
          preferredPosition={['belowRight']}
          closeOnEsc={false}
          trapFocus={false}
          arrow={false}
        >
          {filterField}
          <div className={styles.enhetSelectorDropdown}>
            {availableList}
            {selectedList}
          </div>
        </EinPopup>
      )}
    </div>
  );
}
