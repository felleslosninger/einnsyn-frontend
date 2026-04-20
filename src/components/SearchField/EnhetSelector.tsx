'use client';

import { Button, Heading, Input, Skeleton } from '@digdir/designsystemet-react';
import { type Enhet, isEnhet } from '@digdir/einnsyn-sdk';
import { Buildings3Icon } from '@navikt/aksel-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { VList, type VListHandle } from 'virtua';
import {
  cachedTrimmedEnhetList,
  type TrimmedEnhet,
} from '~/actions/api/enhetActions';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import type { LanguageCode } from '~/lib/translation/translation';
import cn from '~/lib/utils/className';
import { getEnhetHref } from '~/lib/utils/enhetUtils';
import { skeletonString } from '~/lib/utils/skeletonUtils';
import styles from './EnhetSelector.module.scss';
import { EnhetSelectorSelectItem } from './EnhetSelectorSelectItem';
import {
  addEnhetId,
  normalizeEnhetParamValues,
  parseEnhetParam,
  removeEnhetId,
  serializeEnhetParam,
} from './enhetTokenInputUtils';

export type EnhetNode = {
  currentName: string;
  enhet: TrimmedEnhet;
  score: number;
};

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
  const [loading, setLoading] = useState(true);
  const [filterValue, setFilterValue] = useState('');
  const [enhetList, setEnhetList] = useState<TrimmedEnhet[]>([]);
  const [enhetMap, setEnhetMap] = useState<Map<string, TrimmedEnhet>>(
    new Map(),
  );
  const [enhetNodeList, setEnhetNodeList] = useState<EnhetNode[]>([]);
  const [focusedList, setFocusedList] = useState<'available' | 'selected'>(
    'available',
  );
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const availableListRef = useRef<VListHandle>(null);
  const selectedListRef = useRef<VListHandle>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
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
  const initialSelectedEnhetIdsRef = useRef<string[]>(selectedEnhetIds);
  const persistSelectionOnCloseRef = useRef(false);

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

      navigation.push(`${optimisticPathname}?${newSearchParams.toString()}`);
    },
    [navigation, optimisticPathname, optimisticSearchParams],
  );

  // Get the name of an Enhet in the current language
  const getName = useCallback(
    (enhet: TrimmedEnhet) => {
      return languageCode === 'nb'
        ? enhet.navn
        : languageCode === 'nn'
          ? (enhet.navnNynorsk ?? enhet.navn)
          : languageCode === 'se'
            ? (enhet.navnSami ?? enhet.navn)
            : (enhet.navnEngelsk ?? enhet.navn);
    },
    [languageCode],
  );

  const selectedEnhetList = useMemo(() => {
    return selectedEnhetIds.map((id) => {
      const enhet = enhetMap.get(id);
      return {
        id,
        label: enhet ? getName(enhet) : id,
        enhet,
      };
    });
  }, [enhetMap, getName, selectedEnhetIds]);

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

  // Fetch enhet list on mount
  useEffect(() => {
    let unmounted = false;
    cachedTrimmedEnhetList().then((unfilteredEnhetList) => {
      if (unmounted) {
        return;
      }

      const nextEnhetList = unfilteredEnhetList.filter(
        (enhet) => !!enhet.parent,
      );
      const map = new Map<string, TrimmedEnhet>();
      nextEnhetList.forEach((enhet) => {
        map.set(enhet.id, enhet);
      });

      const resolvedEnhetMapById = new Map<string, TrimmedEnhet>();
      const resolveEnhet = (id: string): TrimmedEnhet | undefined => {
        if (resolvedEnhetMapById.has(id)) {
          return resolvedEnhetMapById.get(id);
        }

        const enhet = map.get(id);
        if (!enhet) {
          return undefined;
        }

        const resolvedEnhet = Object.freeze({
          ...enhet,
          parent: (typeof enhet.parent === 'string'
            ? resolveEnhet(enhet.parent)
            : enhet.parent) as Enhet,
        });

        resolvedEnhetMapById.set(id, resolvedEnhet);
        return resolvedEnhet;
      };

      const resolvedEnhetList = nextEnhetList
        .map((enhet) => resolveEnhet(enhet.id))
        .filter((enhet) => enhet !== undefined);

      const resolvedEnhetMap = new Map<string, TrimmedEnhet>();
      resolvedEnhetList.forEach((enhet) => {
        resolvedEnhetMap.set(enhet.id, enhet);
        resolvedEnhetMap.set(getEnhetHref(enhet), enhet);
      });

      setEnhetList(resolvedEnhetList);
      setEnhetMap(resolvedEnhetMap);
      setLoading(false);
    });
    return () => {
      unmounted = true;
    };
  }, []);

  // Update enhet node list when language changes
  useEffect(() => {
    const nextEnhetNodeList = enhetList.map((enhet) => ({
      currentName: getName(enhet),
      enhet,
      children: new Set<EnhetNode>(),
      score: enhet.enhetstype === 'DUMMYENHET' ? 0.5 : 1,
    }));
    setEnhetNodeList(nextEnhetNodeList);
  }, [enhetList, getName]);

  useEffect(() => {
    const wasExpanded = previousExpandedRef.current;

    if (expanded && !wasExpanded) {
      initialSelectedEnhetIdsRef.current = selectedEnhetIds;
      persistSelectionOnCloseRef.current = false;
      focusInput();
    }

    if (!expanded && wasExpanded) {
      setFilterValue('');
      setFocusedIndex(-1);
      setFocusedList('available');

      const persistSelection = persistSelectionOnCloseRef.current;
      persistSelectionOnCloseRef.current = false;

      if (
        !persistSelection &&
        !haveSameEnhetIds(selectedEnhetIds, initialSelectedEnhetIdsRef.current)
      ) {
        setSelectedEnhetIds(initialSelectedEnhetIdsRef.current);
      }
    }

    previousExpandedRef.current = expanded;
  }, [expanded, focusInput, selectedEnhetIds, setSelectedEnhetIds]);

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

  const requestClose = useCallback(
    (persistSelection: boolean) => {
      persistSelectionOnCloseRef.current = persistSelection;
      close?.();
    },
    [close],
  );

  const handleCancel = useCallback(() => {
    requestClose(false);
  }, [requestClose]);

  const handleConfirm = useCallback(() => {
    requestClose(true);
  }, [requestClose]);

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
    if (!expanded) {
      return;
    }

    const options = { align: 'nearest' } as const;

    if (focusedList === 'available' && availableListRef.current) {
      availableListRef.current.scrollToIndex(focusedIndex, options);
    } else if (focusedList === 'selected' && selectedListRef.current) {
      selectedListRef.current.scrollToIndex(focusedIndex, options);
    }
  }, [focusedIndex, focusedList, expanded]);

  useEffect(() => {
    if (!expanded) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const isFooterAction =
        target instanceof HTMLElement &&
        target.closest(`.${styles.selectorFooter}`) !== null;

      if (isFooterAction) {
        if (event.key === 'Escape') {
          event.preventDefault();
          handleCancel();
        }

        return;
      }

      const currentList =
        focusedList === 'available' ? visibleEnhetNodeList : selectedEnhetItems;
      const maxIndex = currentList.length - 1;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, maxIndex));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Tab':
          if (focusedIndex >= 0) {
            event.preventDefault();
            if (event.shiftKey) {
              if (focusedList === 'selected') {
                setFocusedList('available');
                setFocusedIndex(0);
              } else {
                setFocusedIndex(-1);
                requestAnimationFrame(() => {
                  inputRef.current?.focus();
                });
              }
              break;
            }

            if (focusedList === 'available' && selectedEnhetItems.length > 0) {
              setFocusedList('selected');
              setFocusedIndex(0);
            } else {
              setFocusedIndex(-1);
              requestAnimationFrame(() => {
                cancelButtonRef.current?.focus();
              });
            }
          }
          break;
        case 'Enter':
          event.preventDefault();
          if (
            focusedList === 'available' &&
            visibleEnhetNodeList[focusedIndex]
          ) {
            addEnhetHandler(visibleEnhetNodeList[focusedIndex].enhet);
          } else if (
            focusedList === 'selected' &&
            selectedEnhetItems[focusedIndex]
          ) {
            removeEnhetHandler(selectedEnhetItems[focusedIndex]);
          }
          break;
        case 'Escape':
          if (focusedIndex >= 0) {
            setFocusedIndex(-1);
            setFocusedList('available');
            inputRef.current?.focus();
          } else {
            handleCancel();
          }
          event.preventDefault();
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
    focusedIndex,
    focusedList,
    handleCancel,
    removeEnhetHandler,
    selectedEnhetItems.length,
    selectedEnhetItems,
    visibleEnhetNodeList,
  ]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Reset focus state whenever the search string changes.
  useEffect(() => {
    setFocusedIndex(-1);
    setFocusedList('available');
    availableListRef.current?.scrollToIndex(0, { align: 'start' });
  }, [searchString]);

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
        <div className={styles.selectorPopup}>
          <div className={styles.filterField}>
            <Input
              ref={inputRef}
              className={styles.filterFieldInput}
              type="search"
              value={filterValue}
              onChange={onInputChange}
              onKeyDown={onInputKeyDown}
              aria-label={t('search.enhetFilterPlaceholder')}
              placeholder={t('search.enhetFilterPlaceholder')}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="none"
            />
          </div>

          <div className={styles.enhetSelectorDropdown}>
            <div className={styles.enhetSelectorDropdownListContainer}>
              <div className={styles.enhetSelectorDropdownLabelRow}>
                <Heading
                  className={styles.enhetSelectorDropdownLabel}
                  level={2}
                  data-size="2xs"
                >
                  {t('search.availableEnheter')}
                </Heading>
              </div>
              <VList
                ref={availableListRef}
                className={styles.enhetSelectorDropdownList}
                style={{ contain: 'content' }}
              >
                {visibleEnhetNodeList.map((enhetNode, index) => (
                  <EnhetSelectorSelectItem
                    key={`add-${enhetNode.enhet.id}`}
                    enhet={enhetNode.enhet}
                    onClick={() => addEnhetHandler(enhetNode.enhet)}
                    isFocused={
                      focusedList === 'available' && focusedIndex === index
                    }
                    isSelected={selectedEnhetIds.includes(
                      getEnhetHref(enhetNode.enhet),
                    )}
                  />
                ))}
                {loading &&
                  [0, 1, 2, 3].map((index) =>
                    renderSkeleton(`loading-available-${index}`),
                  )}
              </VList>
            </div>

            <div className={styles.enhetSelectorDropdownListContainer}>
              <div className={styles.enhetSelectorDropdownLabelRow}>
                <Heading
                  className={styles.enhetSelectorDropdownLabel}
                  level={2}
                  data-size="2xs"
                >
                  {t('search.selectedEnheter')}
                </Heading>
              </div>
              <VList
                ref={selectedListRef}
                className={styles.enhetSelectorDropdownList}
              >
                {selectedEnhetItems.map((enhet, index) => (
                  <EnhetSelectorSelectItem
                    key={`remove-${enhet.id}`}
                    enhet={enhet}
                    remove={true}
                    onClick={() => removeEnhetHandler(enhet)}
                    isFocused={
                      focusedList === 'selected' && focusedIndex === index
                    }
                  />
                ))}
              </VList>
            </div>
          </div>

          <div className={styles.selectorFooter}>
            <Button
              ref={cancelButtonRef}
              type="button"
              variant="secondary"
              onClick={handleCancel}
            >
              {t('common.cancel')}
            </Button>
            <Button type="button" onClick={handleConfirm}>
              {t('common.select')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function haveSameEnhetIds(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((enhetId, index) => enhetId === right[index])
  );
}

/**
 * Get the earliest match position for any of the name fields
 * @param enhet
 * @param searchWord
 * @returns
 */
function getScore(
  enhet: TrimmedEnhet,
  searchWord: string,
  currentLanguageCode: LanguageCode,
) {
  let score = 0;
  let depth = 1;

  const name = {
    nb: enhet.navn.toLowerCase(),
    nn: enhet.navnNynorsk?.toLowerCase(),
    se: enhet.navnSami?.toLowerCase(),
    en: enhet.navnEngelsk?.toLowerCase(),
  };

  if (enhet.enhetstype !== 'DUMMYENHET') {
    const languageWeights = {
      nb: currentLanguageCode === 'nb' ? 1.0 : 0.1,
      nn: currentLanguageCode === 'nn' ? 1.0 : 0.1,
      se: currentLanguageCode === 'se' ? 1.0 : 0.1,
      en: currentLanguageCode === 'en' ? 1.0 : 0.1,
    };

    const matches = [
      { index: name.nb.indexOf(searchWord), weight: languageWeights.nb },
      { index: name.nn?.indexOf(searchWord) ?? -1, weight: languageWeights.nn },
      { index: name.se?.indexOf(searchWord) ?? -1, weight: languageWeights.se },
      { index: name.en?.indexOf(searchWord) ?? -1, weight: languageWeights.en },
    ].filter((match) => match.index >= 0);

    const bestScore = matches.reduce((currentScore, match) => {
      const thisScore = Math.max(1, 10 - match.index / 10) * match.weight;
      return thisScore > currentScore ? thisScore : currentScore;
    }, 0);

    score += bestScore;
  }

  if (isEnhet(enhet.parent)) {
    const [parentScore, parentDepth] = getScore(
      enhet.parent as TrimmedEnhet,
      searchWord,
      currentLanguageCode,
    );
    if (parentScore > 0) {
      score += parentScore * 0.2;
    }
    depth += parentDepth;
  }

  return [score, depth];
}

function filterEnhetList(
  allNodes: EnhetNode[],
  searchString: string,
  currentLanguageCode: LanguageCode,
): EnhetNode[] {
  if (searchString.trim().length === 0) {
    return allNodes.sort(sortNodes);
  }

  const searchWords = searchString
    .toLowerCase()
    .split(' ')
    .filter((word) => word.length > 0);

  return allNodes
    .map((enhetNode) => {
      let score = 0;

      for (const word of searchWords) {
        const [wordScore, depth] = getScore(
          enhetNode.enhet,
          word,
          currentLanguageCode,
        );
        if (wordScore <= 0) {
          score = 0;
          break;
        }
        score += wordScore / Math.max(1, depth);
      }

      if (enhetNode.enhet.enhetstype === 'DUMMYENHET') {
        score *= 0.5;
      }

      return {
        ...enhetNode,
        score,
      };
    })
    .filter((enhetNode) => !!enhetNode && enhetNode.score > 0)
    .sort(sortNodes);
}

const depthCache = new Map<string, number>();

function getDepth(enhet: TrimmedEnhet): number {
  const cachedDepth = depthCache.get(enhet.id);
  if (cachedDepth !== undefined) {
    return cachedDepth;
  }

  const depth = isEnhet(enhet.parent)
    ? 1 + getDepth(enhet.parent as TrimmedEnhet)
    : 0;

  depthCache.set(enhet.id, depth);
  return depth;
}

function sortNodes(a: EnhetNode, b: EnhetNode) {
  if (a.score !== b.score) {
    return b.score - a.score;
  }

  const aDepth = getDepth(a.enhet);
  const bDepth = getDepth(b.enhet);
  if (aDepth !== bDepth) {
    return aDepth - bDepth;
  }

  return a.currentName?.localeCompare(b.currentName, 'no') ?? 0;
}
