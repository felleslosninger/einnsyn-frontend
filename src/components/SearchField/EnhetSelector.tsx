'use client';

import { Heading, Search, Skeleton } from '@digdir/designsystemet-react';
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
import { useEnhetCache } from '~/components/EnhetCacheProvider/EnhetCacheProvider';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { getEnhetHref, getName } from '~/lib/utils/enhetUtils';
import { skeletonString } from '~/lib/utils/skeletonUtils';
import type { TrimmedEnhet } from '~/lib/utils/trimmedEnhetUtils';
import styles from './EnhetSelector.module.scss';
import { type EnhetNode, filterEnhetList } from './enhetSearch';
import { EnhetSelectorSelectItem } from './EnhetSelectorSelectItem';
import {
  addEnhetId,
  normalizeEnhetParamValues,
  parseEnhetParam,
  removeEnhetId,
  serializeEnhetParam,
} from './enhetTokenInputUtils';

export default function EnhetSelector({
  className,
  expanded = false,
  close,
}: {
  className?: string;
  expanded?: boolean;
  close?: () => void;
}) {
  const languageCode = useLanguageCode();
  const t = useTranslation();
  const navigation = useNavigation();
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
  const inputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const availableListRef = useRef<VListHandle>(null);
  const selectedListRef = useRef<VListHandle>(null);
  const previousExpandedRef = useRef(expanded);

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

      navigation.replace(
        `${optimisticPathname}?${newSearchParams.toString()}`,
      );
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
      if (!expanded) {
        return;
      }

      event.preventDefault();
      focusInput();
    },
    [expanded, focusInput],
  );

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
    if (expanded && !fullListLoaded) {
      ensureFullList();
    }
  }, [expanded, fullListLoaded, ensureFullList]);

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

    if (expanded && !wasExpanded) {
      focusInput();
    }

    if (!expanded && wasExpanded) {
      setFilterValue('');
      setFocus(null);
    }

    previousExpandedRef.current = expanded;
  }, [expanded, focusInput]);

  useLayoutEffect(() => {
    const selector = containerRef.current;
    const popup = popupRef.current;
    if (!selector) {
      return;
    }

    const pageRoot = selector.closest('.einnsyn-body');
    const homeHeader = selector.closest('header.section-home');

    const resetPopupLayout = () => {
      delete selector.dataset.popupLayout;
      selector.style.removeProperty('--selector-popup-inline-size');
      selector.style.removeProperty('--selector-popup-inline-start');
    };

    const resetLandingPageOverflow = () => {
      if (pageRoot instanceof HTMLElement) {
        pageRoot.style.removeProperty('--landing-page-selector-overflow');
      }
    };

    if (!expanded || !popup || typeof window === 'undefined') {
      resetPopupLayout();
      resetLandingPageOverflow();
      return;
    }

    const searchField = selector.closest(
      '[data-search-field-container="true"]',
    );
    if (!(searchField instanceof HTMLElement)) {
      resetPopupLayout();
      resetLandingPageOverflow();
      return;
    }

    const updatePopupLayout = () => {
      resetPopupLayout();

      const selectorRect = selector.getBoundingClientRect();
      const searchFieldRect = searchField.getBoundingClientRect();
      let popupRect = popup.getBoundingClientRect();

      if (popupRect.left < searchFieldRect.left - 0.5) {
        selector.dataset.popupLayout = 'search-field';
        selector.style.setProperty(
          '--selector-popup-inline-size',
          `${searchFieldRect.width}px`,
        );
        selector.style.setProperty(
          '--selector-popup-inline-start',
          `${searchFieldRect.left - selectorRect.left}px`,
        );
        popupRect = popup.getBoundingClientRect();
      }

      if (
        !(pageRoot instanceof HTMLElement) ||
        !(homeHeader instanceof HTMLElement)
      ) {
        resetLandingPageOverflow();
        return;
      }

      const homeHeaderRect = homeHeader.getBoundingClientRect();
      const popupOverflow = Math.max(
        0,
        Math.ceil(popupRect.bottom - homeHeaderRect.bottom),
      );

      pageRoot.style.setProperty(
        '--landing-page-selector-overflow',
        `${popupOverflow}px`,
      );
    };

    updatePopupLayout();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updatePopupLayout);
      return () => {
        window.removeEventListener('resize', updatePopupLayout);
        resetPopupLayout();
        resetLandingPageOverflow();
      };
    }

    const resizeObserver = new ResizeObserver(() => {
      updatePopupLayout();
    });

    resizeObserver.observe(selector);
    resizeObserver.observe(searchField);
    resizeObserver.observe(popup);
    if (homeHeader instanceof HTMLElement) {
      resizeObserver.observe(homeHeader);
    }
    window.addEventListener('resize', updatePopupLayout);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updatePopupLayout);
      resetPopupLayout();
      resetLandingPageOverflow();
    };
  }, [expanded]);

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
    if (!expanded || !focus) {
      return;
    }

    const listRef =
      focus.list === 'available' ? availableListRef : selectedListRef;
    listRef.current?.scrollToIndex(focus.index, { align: 'nearest' });
  }, [focus, expanded]);

  useEffect(() => {
    setFocus((prev) => {
      if (!prev || prev.list !== 'available') {
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

  useEffect(() => {
    if (!expanded) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
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
        case 'ArrowRight':
          if (focus?.list === 'available' && selectedEnhetItems.length > 0) {
            event.preventDefault();
            setFocus({ list: 'selected', index: 0 });
          }
          break;
        case 'ArrowLeft':
          if (focus?.list === 'selected') {
            event.preventDefault();
            setFocus(
              visibleEnhetNodeList.length > 0
                ? { list: 'available', index: 0 }
                : null,
            );
          }
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
    };

    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [
    addEnhetHandler,
    expanded,
    focus,
    removeEnhetHandler,
    selectedEnhetItems,
    close,
    visibleEnhetNodeList,
  ]);

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

  return (
    <div className={cn(styles.enhetSelector, className)} ref={containerRef}>
      <div className={styles.selectorField}>
        <button
          type="button"
          className={cn(styles.summaryButton, {
            [styles.summaryButtonActive]: expanded,
          })}
          aria-label={selectedSummary || t('search.enhetPlaceholder')}
          aria-expanded={expanded}
          aria-haspopup="listbox"
          onClick={focusInput}
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
      </div>

      {expanded && (
        <div className={styles.selectorPopup} ref={popupRef}>
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

          <div className={styles.enhetSelectorDropdown}>
            <div className={styles.enhetSelectorDropdownListContainer}>
              <div className={styles.enhetSelectorDropdownLabelRow}>
                <Heading
                  className={styles.enhetSelectorDropdownLabel}
                  level={2}
                  data-size="2xs"
                >
                  {t('search.availableEnheter')} ({visibleEnhetNodeList.length})
                </Heading>
              </div>
              <VList
                ref={availableListRef}
                className={styles.enhetSelectorDropdownList}
                style={{ contain: 'content' }}
                aria-label={t('search.availableEnheter')}
              >
                {visibleEnhetNodeList.map((enhetNode, index) => (
                  <EnhetSelectorSelectItem
                    key={`add-${enhetNode.enhet.id}`}
                    id={`enhet-option-available-${enhetNode.enhet.id}`}
                    enhet={enhetNode.enhet}
                    onClick={() => addEnhetHandler(enhetNode.enhet)}
                    variant="available"
                    actionLabel={t('common.add')}
                    isSelected={selectedEnhetIds.includes(
                      getEnhetHref(enhetNode.enhet),
                    )}
                    isFocused={
                      focus?.list === 'available' && focus.index === index
                    }
                  />
                ))}
                {!fullListLoaded &&
                  [0, 1, 2, 3].map((index) =>
                    renderSkeleton(`loading-available-${index}`),
                  )}
                {fullListLoaded && visibleEnhetNodeList.length === 0 && (
                  <div className={styles.emptyState}>
                    {t('common.noResults')}
                  </div>
                )}
              </VList>
            </div>

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
              >
                {selectedEnhetItems.map((enhet, index) => (
                  <EnhetSelectorSelectItem
                    key={`remove-${enhet.id}`}
                    id={`enhet-option-selected-${enhet.id}`}
                    enhet={enhet}
                    onClick={() => removeEnhetHandler(enhet)}
                    variant="selected"
                    actionLabel={t('common.remove')}
                    isFocused={
                      focus?.list === 'selected' && focus.index === index
                    }
                  />
                ))}
              </VList>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

