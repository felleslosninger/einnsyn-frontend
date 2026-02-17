'use client';

import { Skeleton } from '@digdir/designsystemet-react';
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
import type { LanguageCode } from '~/lib/translation/translation';
import cn from '~/lib/utils/className';
import { skeletonString } from '~/lib/utils/skeletonUtils';
import styles from './EnhetSelector.module.scss';
import { EnhetSelectorSelectItem } from './EnhetSelectorSelectItem';
import {
  enhetParamToQuery,
  getActiveEnhetFilterSegment,
  getEnhetIdsFromQuery,
  insertEnhetToken,
  removeEnhetToken,
} from './enhetTokenInputUtils';
import { StyledInput } from './StyledInput';

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
  const navigation = useNavigation();
  const { optimisticSearchParams, optimisticPathname } = navigation;
  const enhetSearchQuery = optimisticSearchParams?.get('enhet') ?? '';
  const [loading, setLoading] = useState(true);
  const enhetTokenQuery = useMemo(
    () => enhetParamToQuery(enhetSearchQuery),
    [enhetSearchQuery],
  );
  const [inputValue, setInputValue] = useState(enhetTokenQuery);
  const [caretPosition, setCaretPosition] = useState(enhetTokenQuery.length);
  const [enhetList, setEnhetList] = useState<TrimmedEnhet[]>([]);
  const [enhetMap, setEnhetMap] = useState<Map<string, TrimmedEnhet>>(
    new Map(),
  );
  const [enhetNodeList, setEnhetNodeList] = useState<EnhetNode[]>([]);
  const [focusedList, setFocusedList] = useState<'available' | 'selected'>(
    'available',
  );
  const [focusedIndex, setFocusedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Refs for virtua handles
  const availableListRef = useRef<VListHandle>(null);
  const selectedListRef = useRef<VListHandle>(null);

  const selectedEnhetIds = useMemo(
    () => getEnhetIdsFromQuery(inputValue),
    [inputValue],
  );

  const selectedEnhetList = useMemo(() => {
    return selectedEnhetIds
      .map((id) => enhetMap.get(id))
      .filter((e): e is TrimmedEnhet => e !== undefined);
  }, [selectedEnhetIds, enhetMap]);
  const selectedEnhetParam = useMemo(
    () => selectedEnhetIds.join(','),
    [selectedEnhetIds],
  );

  // Update search query
  const setSelectedEnhetIds = useCallback(
    (newSelectedEnhetIds: string[]) => {
      const newSearchParams = new URLSearchParams(
        optimisticSearchParams.toString(),
      );
      newSearchParams.delete('enhet');
      const newEnhetParam = newSelectedEnhetIds.join(',');
      if (newEnhetParam.length > 0) {
        newSearchParams.set('enhet', newEnhetParam);
      }
      const newSearchParamsString = newSearchParams.toString();
      navigation.push(`${optimisticPathname}?${newSearchParamsString}`);
    },
    [navigation, optimisticPathname, optimisticSearchParams],
  );

  const updateInputValue = useCallback(
    (nextInputValue: string) => {
      setInputValue(nextInputValue);
      const nextEnhetIds = getEnhetIdsFromQuery(nextInputValue);
      const nextEnhetParam = nextEnhetIds.join(',');
      if (nextEnhetParam !== selectedEnhetParam) {
        setSelectedEnhetIds(nextEnhetIds);
      }
    },
    [selectedEnhetParam, setSelectedEnhetIds],
  );

  useEffect(() => {
    setInputValue(enhetTokenQuery);
    setCaretPosition(enhetTokenQuery.length);
  }, [enhetTokenQuery]);

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

  const activeFilterSegment = useMemo(
    () => getActiveEnhetFilterSegment(inputValue, caretPosition),
    [inputValue, caretPosition],
  );
  const searchString = activeFilterSegment.value;

  // Get a sorted tree structure of enheter, filtered by search string
  const visibleEnhetNodeList: EnhetNode[] = useMemo(() => {
    const filteredList = filterEnhetList(
      enhetNodeList,
      searchString,
      languageCode,
    );
    return filteredList;
  }, [enhetNodeList, searchString, languageCode]);

  // Fetch enhet list on mount
  useEffect(() => {
    let unmounted = false;
    cachedTrimmedEnhetList().then((unfilteredEnhetList) => {
      if (unmounted) {
        return;
      }

      // Remove DUMMYENHET
      // const filteredEnhetList = enhetList.filter(
      //   (enhet) => enhet.enhetstype !== 'DUMMYENHET',
      // );
      // Remove root
      const enhetList = unfilteredEnhetList.filter((enhet) => !!enhet.parent);

      // Remove parent.id where .parent doesn't exist in the list (after filtering DUMMYENHET)
      const map = new Map<string, TrimmedEnhet>();
      enhetList.forEach((enhet) => {
        map.set(enhet.id, enhet);
      });

      const resolvedEnhetMap = new Map<string, TrimmedEnhet>();
      const resolveEnhet = (id: string): TrimmedEnhet | undefined => {
        if (id === undefined) {
          return undefined;
        }

        if (resolvedEnhetMap.has(id)) {
          return resolvedEnhetMap.get(id);
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

        resolvedEnhetMap.set(id, resolvedEnhet);
        return resolvedEnhet;
      };

      const resolvedEnhetList = enhetList
        .map((enhet) => {
          return resolveEnhet(enhet.id);
        })
        .filter((enhet) => enhet !== undefined);

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
    const enhetNodeList = enhetList.map((enhet) => ({
      currentName: getName(enhet),
      enhet,
      children: new Set<EnhetNode>(),
      score: enhet.enhetstype === 'DUMMYENHET' ? 0.5 : 1,
    }));
    setEnhetNodeList(enhetNodeList);
  }, [enhetList, getName]);

  const updateCaretPosition = useCallback(
    (event: React.SyntheticEvent<HTMLTextAreaElement>) => {
      setCaretPosition(event.currentTarget.selectionStart ?? 0);
    },
    [],
  );

  const onInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
      }
      setCaretPosition(event.currentTarget.selectionStart ?? 0);
    },
    [],
  );

  const addEnhetHandler = useCallback(
    (enhet: TrimmedEnhet) => {
      const insertion = insertEnhetToken(inputValue, caretPosition, enhet.id);
      if (insertion.query === inputValue) {
        return;
      }

      updateInputValue(insertion.query);
      setCaretPosition(insertion.caretPosition);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.setSelectionRange(
          insertion.caretPosition,
          insertion.caretPosition,
        );
      });
    },
    [caretPosition, inputValue, updateInputValue],
  );

  const removeEnhetHandler = useCallback(
    (enhet: TrimmedEnhet) => {
      const nextInputValue = removeEnhetToken(inputValue, enhet.id);
      if (nextInputValue === inputValue) {
        return;
      }

      updateInputValue(nextInputValue);
      const nextCaretPosition = Math.min(caretPosition, nextInputValue.length);
      setCaretPosition(nextCaretPosition);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.setSelectionRange(
          nextCaretPosition,
          nextCaretPosition,
        );
      });
    },
    [caretPosition, inputValue, updateInputValue],
  );

  // Scroll to focused item when index changes
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

  // Handle keyboard navigation
  useEffect(() => {
    if (!expanded) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentList =
        focusedList === 'available' ? visibleEnhetNodeList : selectedEnhetList;
      const maxIndex = currentList.length - 1;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, maxIndex));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Tab':
          if (focusedIndex >= 0) {
            e.preventDefault();
            setFocusedList((prev) =>
              prev === 'available' && focusedIndex >= 0
                ? 'selected'
                : 'available',
            );
            setFocusedIndex(0);
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (
            focusedList === 'available' &&
            visibleEnhetNodeList[focusedIndex]
          ) {
            addEnhetHandler(visibleEnhetNodeList[focusedIndex].enhet);
          } else if (
            focusedList === 'selected' &&
            selectedEnhetList[focusedIndex]
          ) {
            removeEnhetHandler(selectedEnhetList[focusedIndex]);
          }
          break;
        case 'Escape':
          if (focusedIndex >= 0) {
            setFocusedIndex(-1);
            setFocusedList('available');
            inputRef.current?.focus();
          } else {
            close?.();
          }
          e.preventDefault();
          break;
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      return () => container.removeEventListener('keydown', handleKeyDown);
    }
  }, [
    close,
    expanded,
    focusedList,
    focusedIndex,
    visibleEnhetNodeList,
    selectedEnhetList,
    addEnhetHandler,
    removeEnhetHandler,
  ]);

  // Reset focus when search string changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: Always update on searchString change
  useEffect(() => {
    setFocusedIndex(-1);
    setFocusedList('available');
    // Ensure scroll resets to top on search change
    availableListRef.current?.scrollToIndex(0, { align: 'start' });
  }, [searchString]);

  const renderSkeleton = () => {
    const name = skeletonString(10, 60);

    return (
      <div className={cn(styles.selectorListItem)}>
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
      <StyledInput
        ref={inputRef}
        className={cn(styles.enhetSelectorInput)}
        expandInFlow={true}
        icon={
          <Buildings3Icon
            className={cn(styles.searchIcon)}
            title="Enhet"
            fontSize="1.2rem"
          />
        }
        value={inputValue}
        setValue={updateInputValue}
        placeholder="Alle virksomheter"
        onFocus={updateCaretPosition}
        onInput={updateCaretPosition}
        onKeyDown={onInputKeyDown}
        onKeyUp={updateCaretPosition}
        onClick={updateCaretPosition}
        onSelect={updateCaretPosition}
      />

      {expanded && (
        <div className={cn(styles.enhetSelectorDropdown)}>
          {/* Available List */}
          <div className={cn(styles.enhetSelectorDropdownListContainer)}>
            <VList
              ref={availableListRef}
              className={cn(styles.enhetSelectorDropdownList)}
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
                  isSelected={selectedEnhetIds.includes(enhetNode.enhet.id)}
                />
              ))}
              {loading && [0, 1, 2, 3].map(() => renderSkeleton())}
            </VList>
          </div>

          {/* Selected List */}
          <div className={cn(styles.enhetSelectorDropdownListContainer)}>
            <VList
              ref={selectedListRef}
              className={cn(styles.enhetSelectorDropdownList)}
            >
              {selectedEnhetList.map((enhet, index) => (
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
      )}
    </div>
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
    // Prioritize current language. Other languages should give a match, but only barely.
    const languageWeights = {
      nb: currentLanguageCode === 'nb' ? 1.0 : 0.1,
      nn: currentLanguageCode === 'nn' ? 1.0 : 0.1,
      se: currentLanguageCode === 'se' ? 1.0 : 0.1,
      en: currentLanguageCode === 'en' ? 1.0 : 0.1,
    };

    // Match
    const matches = [
      { index: name.nb.indexOf(searchWord), weight: languageWeights.nb },
      { index: name.nn?.indexOf(searchWord) ?? -1, weight: languageWeights.nn },
      { index: name.se?.indexOf(searchWord) ?? -1, weight: languageWeights.se },
      { index: name.en?.indexOf(searchWord) ?? -1, weight: languageWeights.en },
    ].filter((m) => m.index >= 0);

    const bestScore = matches.reduce((currentScore, match) => {
      const thisScore = Math.max(1, 10 - match.index / 10) * match.weight;
      return thisScore > currentScore ? thisScore : currentScore;
    }, 0);

    score += bestScore;
  }

  // Recursively check parents for matches
  if (isEnhet(enhet.parent)) {
    const [parentScore, parentDepth] = getScore(
      enhet.parent as TrimmedEnhet,
      searchWord,
      currentLanguageCode,
    );
    if (parentScore > 0) {
      // Parent match gives lower score
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
    .filter((w) => w.length > 0);

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
        score += wordScore / Math.max(1, depth); // Prioritize "shallow" matches higher
      }

      // Reduce score for DUMMYENHET
      if (enhetNode.enhet.enhetstype === 'DUMMYENHET') {
        score *= 0.5;
      }

      return {
        ...enhetNode,
        // enhet: {
        //   ...enhetNode.enhet,
        //   navn: enhetNode.currentName + ' ' + score,
        // },
        score,
      };
    })
    .filter((enhetNode) => !!enhetNode && enhetNode.score > 0)
    .sort(sortNodes);
}

const depthCache = new Map<string, number>();
// Get depth of enhet in hierarchy, with caching
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
  // Sort by score
  if (a.score !== b.score) {
    return b.score - a.score;
  }

  // Sort by parent depth. Fewer ancestors (shallower) first
  const aDepth = getDepth(a.enhet);
  const bDepth = getDepth(b.enhet);
  if (aDepth !== bDepth) {
    return aDepth - bDepth;
  }

  // Sort by currently active name
  return a.currentName?.localeCompare(b.currentName, 'no') ?? 0;
}
