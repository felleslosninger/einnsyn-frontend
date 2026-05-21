'use client';

import { Button, Search, Skeleton } from '@digdir/designsystemet-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { VList, type VListHandle } from 'virtua';
import EinModal, { EinModalHeader } from '~/components/EinModal/EinModal';
import EinPopup from '~/components/EinPopup/EinPopup';
import { useEnhetCache } from '~/components/EnhetCacheProvider/EnhetCacheProvider';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import useBreakpoint from '~/hooks/useBreakpoint';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import {
  formatOrgnummer,
  getAncestorsAsString,
  getEnhetHref,
  getName,
} from '~/lib/utils/enhetUtils';
import { skeletonString } from '~/lib/utils/skeletonUtils';
import type { TrimmedEnhet } from '~/lib/utils/trimmedEnhetUtils';
import styles from './EnhetSelector.module.scss';
import { EnhetSelectorMobileItem } from './EnhetSelectorMobileItem';
import { EnhetSelectorSelectItem } from './EnhetSelectorSelectItem';
import { EnhetSummaryDesktop, EnhetSummaryMobile } from './EnhetSummary';
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
  layout = 'desktop',
}: {
  className?: string;
  active?: boolean;
  activate?: () => void;
  close?: () => void;
  layout?: 'desktop' | 'mobile';
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
  const inputRef = useRef<HTMLInputElement>(null);
  const availableListRef = useRef<VListHandle>(null);
  const selectedListRef = useRef<VListHandle>(null);
  const previousExpandedRef = useRef(active);

  const selectedEnhetQueryValues = useMemo(
    () => parseEnhetParam(enhetSearchQuery),
    [enhetSearchQuery],
  );
  const urlSelectedEnhetIds = useMemo(
    () =>
      normalizeEnhetParamValues(
        selectedEnhetQueryValues.map((value) => {
          const enhet = enhetMap.get(value);
          return enhet ? getEnhetHref(enhet) : value;
        }),
      ),
    [enhetMap, selectedEnhetQueryValues],
  );

  // Desktop picker buffers selections until the user clicks "Bruk valg" —
  // changes only commit to the URL on Apply. Mobile stays real-time.
  const isBuffered = !isMobileLayout && active;
  const [draftSelectedIds, setDraftSelectedIds] = useState<string[]>([]);

  // Re-seed the draft from the URL whenever the desktop modal opens.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-init only on transition into buffered mode; URL changes mid-open are intentionally not synced (the user is editing).
  useEffect(() => {
    if (isBuffered) {
      setDraftSelectedIds(urlSelectedEnhetIds);
    }
  }, [isBuffered]);

  const selectedEnhetIds = isBuffered ? draftSelectedIds : urlSelectedEnhetIds;

  const commitSelectedEnhetIdsToUrl = useCallback(
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

  const setSelectedEnhetIds = useCallback(
    (nextSelectedEnhetIds: string[]) => {
      if (isBuffered) {
        setDraftSelectedIds(nextSelectedEnhetIds);
      } else {
        commitSelectedEnhetIdsToUrl(nextSelectedEnhetIds);
      }
    },
    [isBuffered, commitSelectedEnhetIdsToUrl],
  );

  const applySelection = useCallback(() => {
    commitSelectedEnhetIdsToUrl(draftSelectedIds);
    close?.();
  }, [commitSelectedEnhetIdsToUrl, draftSelectedIds, close]);

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

  const searchString = filterValue;

  // Get a sorted tree structure of enheter, filtered by search string
  const visibleEnhetNodeList: EnhetNode[] = useMemo(() => {
    return filterEnhetList(enhetNodeList, searchString, languageCode);
  }, [enhetNodeList, searchString, languageCode]);

  // Split the search-filtered list into selected/available buckets.
  //
  // - `availableNodes` (non-selected, filtered): used by both layouts as the
  //   left/main column of "what you can add".
  // - `searchMatchedSelectedNodes` (selected, filtered): the mobile sheet
  //   pins these at the top under a "Valgte" header so users can find their
  //   selections in long lists (~2000 items, ~20 selections spread across).
  //   The desktop modal uses `selectedEnhetItems` instead (all selected,
  //   unfiltered) so the right column is a stable manage-your-selection view.
  const { searchMatchedSelectedNodes, availableNodes } = useMemo(() => {
    const selectedSet = new Set(selectedEnhetIds);
    const selected: EnhetNode[] = [];
    const available: EnhetNode[] = [];
    for (const node of visibleEnhetNodeList) {
      if (selectedSet.has(getEnhetHref(node.enhet))) {
        selected.push(node);
      } else {
        available.push(node);
      }
    }
    return {
      searchMatchedSelectedNodes: selected,
      availableNodes: available,
    };
  }, [visibleEnhetNodeList, selectedEnhetIds]);

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
      if (availableNodes.length === 0) {
        return null;
      }
      const maxIndex = availableNodes.length - 1;
      return prev.index > maxIndex
        ? { list: 'available', index: maxIndex }
        : prev;
    });
  }, [availableNodes.length]);

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
              list === 'selected' ? selectedEnhetItems : availableNodes;
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
              list === 'selected' ? selectedEnhetItems : availableNodes;
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
            const node = availableNodes[focus.index];
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
      availableNodes,
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
      const node = availableNodes[focus.index];
      return node ? `enhet-option-available-${node.enhet.id}` : undefined;
    }
    const enhet = selectedEnhetItems[focus.index];
    return enhet ? `enhet-option-selected-${enhet.id}` : undefined;
  }, [focus, availableNodes, selectedEnhetItems]);

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

  const SummaryComponent =
    layout === 'mobile' ? EnhetSummaryMobile : EnhetSummaryDesktop;

  const summaryButton = (
    <SummaryComponent
      ref={summaryButtonRef}
      active={active}
      selectedSummary={selectedSummary}
      summaryLabel={summaryLabel}
      additionalSelectedCount={additionalSelectedCount}
      onClick={onSummaryClick}
      onFocus={onSummaryFocus}
      onMouseDown={onSummaryMouseDown}
    />
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

  // Resolve a row's second line: ancestors when the enhet is a sub-unit,
  // else "Type · org.nr 123 456 789" for top-level enheter so the user can
  // disambiguate organisations that share a name.
  const getRowSubtitle = useCallback(
    (enhet: TrimmedEnhet): string | undefined => {
      const ancestors = getAncestorsAsString(enhet, ' / ', languageCode);
      if (ancestors) return ancestors;
      const typeKey = `search.enhetstype.${enhet.enhetstype}`;
      const typeLabel = t(typeKey);
      const hasTypeLabel = typeLabel !== typeKey;
      const orgnr = enhet.orgnummer ? formatOrgnummer(enhet.orgnummer) : '';
      if (hasTypeLabel && orgnr) {
        return `${typeLabel} · ${t('search.orgNumberPrefix')} ${orgnr}`;
      }
      if (hasTypeLabel) return typeLabel;
      if (orgnr) return `${t('search.orgNumberPrefix')} ${orgnr}`;
      return undefined;
    },
    [t, languageCode],
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
          <EinModalHeader title={t('search.enhetSelectorTitle')} />
          {filterField}
          <div className={cn(styles.mobileListContainer)}>
            <VList
              ref={availableListRef}
              className={styles.mobileList}
              style={{ contain: 'content' }}
              aria-label={t('search.availableEnheter')}
              role="listbox"
            >
              {!searchString && (
                <EnhetSelectorMobileItem
                  id="enhet-option-all"
                  label={t('search.enhetPlaceholder')}
                  isSelected={selectedEnhetIds.length === 0}
                  onClick={clearSelectedEnheter}
                />
              )}
              {searchMatchedSelectedNodes.length > 0 && (
                <div className={styles.mobileSectionHeader}>
                  {t('search.selectedEnheter')} (
                  {searchMatchedSelectedNodes.length})
                </div>
              )}
              {searchMatchedSelectedNodes.map((enhetNode) => {
                const ancestors = getAncestorsAsString(
                  enhetNode.enhet,
                  ' / ',
                  languageCode,
                );
                return (
                  <EnhetSelectorMobileItem
                    key={`selected-${enhetNode.enhet.id}`}
                    id={`enhet-option-selected-${enhetNode.enhet.id}`}
                    label={getName(enhetNode.enhet, languageCode)}
                    ancestors={ancestors || undefined}
                    isSelected
                    onClick={() => toggleEnhetHandler(enhetNode.enhet)}
                  />
                );
              })}
              {searchMatchedSelectedNodes.length > 0 &&
                availableNodes.length > 0 && (
                  <div className={styles.mobileSectionHeader}>
                    {t('search.availableEnheter')}
                  </div>
                )}
              {availableNodes.map((enhetNode, index) => {
                const ancestors = getAncestorsAsString(
                  enhetNode.enhet,
                  ' / ',
                  languageCode,
                );
                return (
                  <EnhetSelectorMobileItem
                    key={`available-${enhetNode.enhet.id}`}
                    id={`enhet-option-available-${enhetNode.enhet.id}`}
                    label={getName(enhetNode.enhet, languageCode)}
                    ancestors={ancestors || undefined}
                    isFocused={
                      focus?.list === 'available' && focus.index === index
                    }
                    onClick={() => toggleEnhetHandler(enhetNode.enhet)}
                  />
                );
              })}
              {!fullListLoaded &&
                [0, 1, 2, 3].map((index) =>
                  renderSkeleton(`loading-mobile-${index}`),
                )}
              {fullListLoaded && visibleEnhetNodeList.length === 0 && (
                <div className={styles.emptyState}>{t('common.noResults')}</div>
              )}
            </VList>
          </div>
        </EinModal>
      ) : (
        <EinPopup
          open={active}
          setOpen={(value) => !value && close?.()}
          anchorRef={summaryButtonRef}
          className={styles.desktopSelectorPopup}
          preferredPosition={['belowRight']}
          closeOnEsc={false}
          trapFocus={false}
          arrow={false}
        >
          <div className={styles.desktopHeader}>
            <div className={styles.desktopTitleBlock}>
              <h1 className={styles.desktopTitle}>
                {t('search.enhetSelectorTitleDesktop')}
              </h1>
              <p className={styles.desktopSubtitle}>
                {t('search.enhetSelectorSubtitle')}
              </p>
            </div>
          </div>
          <div className={styles.desktopBody}>
            {filterField}
            <div className={styles.desktopColumns}>
              <div className={styles.desktopColumn}>
                <div className={styles.desktopColumnHeader}>
                  <span className={styles.desktopColumnLabel}>
                    {t('search.availableEnheter')}
                  </span>
                </div>
                <VList
                  ref={availableListRef}
                  className={styles.desktopColumnList}
                  style={{ contain: 'content' }}
                  aria-label={t('search.availableEnheter')}
                  role="listbox"
                >
                  {availableNodes.map((enhetNode, index) => (
                    <EnhetSelectorSelectItem
                      key={`available-${enhetNode.enhet.id}`}
                      id={`enhet-option-available-${enhetNode.enhet.id}`}
                      enhet={enhetNode.enhet}
                      subtitle={getRowSubtitle(enhetNode.enhet)}
                      variant="available"
                      isFocused={
                        focus?.list === 'available' && focus.index === index
                      }
                      onClick={() => addEnhetHandler(enhetNode.enhet)}
                    />
                  ))}
                  {!fullListLoaded &&
                    [0, 1, 2, 3].map((index) =>
                      renderSkeleton(`loading-available-${index}`),
                    )}
                  {fullListLoaded && availableNodes.length === 0 && (
                    <div className={styles.emptyState}>
                      {t('common.noResults')}
                    </div>
                  )}
                </VList>
              </div>
              <div className={styles.desktopColumn}>
                <div className={styles.desktopColumnHeader}>
                  <span className={styles.desktopColumnLabel}>
                    {t('search.selectedEnheter')}
                  </span>
                  {selectedEnhetItems.length > 0 && (
                    <button
                      type="button"
                      className={styles.desktopClearAllButton}
                      onClick={clearSelectedEnheter}
                    >
                      {t('common.removeAll')}
                    </button>
                  )}
                </div>
                <VList
                  ref={selectedListRef}
                  className={styles.desktopColumnList}
                  aria-label={t('search.selectedEnheter')}
                  role="listbox"
                >
                  {selectedEnhetItems.map((enhet, index) => (
                    <EnhetSelectorSelectItem
                      key={`selected-${enhet.id}`}
                      id={`enhet-option-selected-${enhet.id}`}
                      enhet={enhet}
                      subtitle={getRowSubtitle(enhet)}
                      variant="selected"
                      isFocused={
                        focus?.list === 'selected' && focus.index === index
                      }
                      onClick={() => removeEnhetHandler(enhet)}
                    />
                  ))}
                </VList>
              </div>
            </div>
          </div>
          <div className={styles.desktopFooter}>
            <span className={styles.desktopFooterCount}>
              {t('search.selectionCount', String(selectedEnhetItems.length))}
            </span>
            <Button
              type="button"
              data-color="neutral"
              data-variant="tertiary"
              onClick={close}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              data-color="accent"
              data-variant="primary"
              onClick={applySelection}
            >
              {t('search.applySelection')}
            </Button>
          </div>
        </EinPopup>
      )}
    </div>
  );
}
