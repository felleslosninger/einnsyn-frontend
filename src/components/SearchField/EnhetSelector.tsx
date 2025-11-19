'use client';

import { type Enhet, isEnhet } from '@digdir/einnsyn-sdk';
import { Buildings3Icon } from '@navikt/aksel-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  cachedTrimmedEnhetList,
  type TrimmedEnhet,
} from '~/actions/api/enhetActions';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinInput } from '~/components/EinInput/EinInput';
import { EinVirtualScroller } from '~/components/EinVirtualScroller';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import cn from '~/lib/utils/className';
import styles from './EnhetSelector.module.scss';
import { EnhetSelectorSelectItem } from './EnhetSelectorSelectItem';
import searchFieldStyles from './SearchField.module.scss';

export type EnhetNode = {
  currentName: string;
  enhet: TrimmedEnhet;
  children: Set<EnhetNode>;
  score: number;
};

export default function EnhetSelector({
  className,
  expanded = false,
}: {
  className?: string;
  expanded?: boolean;
}) {
  const languageCode = useLanguageCode();
  const navigation = useNavigation();
  const { optimisticSearchParams, optimisticPathname } = navigation;
  const enhetSearchQuery = optimisticSearchParams?.get('enhet') ?? '';
  const [searchString, setSearchString] = useState('');
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
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedEnhetList = useMemo(() => {
    const selectedEnhetIds =
      typeof enhetSearchQuery === 'string' && enhetSearchQuery !== ''
        ? enhetSearchQuery.split(',')
        : [];
    return selectedEnhetIds
      .map((id) => enhetMap.get(id))
      .filter((e): e is TrimmedEnhet => e !== undefined);
  }, [enhetSearchQuery, enhetMap]);

  // Update search query
  const setSelectedEnhetList = useCallback(
    (newSelectedEnhetList: TrimmedEnhet[]) => {
      const newSearchParams = new URLSearchParams(
        optimisticSearchParams.toString(),
      );
      newSearchParams.delete('enhet');
      const newEnhetParam = newSelectedEnhetList
        .map((enhet) => enhet.id)
        .join(',');
      if (newEnhetParam.length > 0) {
        newSearchParams.set('enhet', newEnhetParam);
      }
      const newSearchParamsString = newSearchParams.toString();
      navigation.push(`${optimisticPathname}?${newSearchParamsString}`);
    },
    [navigation.push, optimisticPathname, optimisticSearchParams],
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

  // Get a sorted tree structure of enheter, filtered by search string
  const visibleEnhetNodeList: EnhetNode[] = useMemo(() => {
    const filteredList = filterEnhetList(enhetNodeList, searchString);
    const filteredListWithoutSelected = filteredList.filter(
      (node) =>
        !selectedEnhetList.find((selected) => selected.id === node.enhet.id),
    );
    return filteredListWithoutSelected;
  }, [enhetNodeList, searchString, selectedEnhetList]);

  // Fetch enhet list on mount
  useEffect(() => {
    let unmounted = false;
    cachedTrimmedEnhetList().then((enhetList) => {
      if (unmounted) {
        return;
      }

      // Remove DUMMYENHET
      const filteredEnhetList = enhetList.filter(
        (enhet) => enhet.enhetstype !== 'DUMMYENHET',
      );
      // Remove root
      // const filteredEnhetList = enhetList.filter((enhet) => !!enhet.parent);

      // Remove parent.id where .parent doesn't exist in the list (after filtering DUMMYENHET)
      const map = new Map<string, TrimmedEnhet>();
      filteredEnhetList.forEach((enhet) => {
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

        return Object.freeze({
          ...enhet,
          parent: (typeof enhet.parent === 'string'
            ? resolveEnhet(enhet.parent)
            : enhet.parent) as Enhet,
        });
      };

      const resolvedEnhetList = filteredEnhetList
        .map((enhet) => {
          return resolveEnhet(enhet.id);
        })
        .filter((enhet) => enhet !== undefined);

      setEnhetList(resolvedEnhetList);
      setEnhetMap(map);
    });
    return () => {
      unmounted = true;
    };
  }, []);

  // Update enhet node list
  useEffect(() => {
    const enhetNodeLIst = enhetList.map((enhet) => ({
      currentName: getName(enhet),
      enhet,
      children: new Set<EnhetNode>(),
      score: -1,
    }));
    setEnhetNodeList(enhetNodeLIst);
  }, [enhetList, getName]);

  // Get label for input field
  const label = useMemo(() => {
    return selectedEnhetList.length > 0
      ? selectedEnhetList.map((enhet) => getName(enhet)).join(', ')
      : 'Alle virksomheter';
  }, [selectedEnhetList, getName]);

  const updateSearchString = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchString(e.target.value);
    },
    [],
  );

  const addEnhetHandler = useCallback(
    (e: React.MouseEvent<HTMLUListElement>) => {
      const li = (e.target as HTMLElement).closest('li');
      const index = Number(li?.dataset.index);
      if (Number.isNaN(index)) return;
      const enhetNode = visibleEnhetNodeList[index];
      if (!enhetNode) return;

      const prevSelected = selectedEnhetList;
      const filtered = prevSelected.filter((n) => n.id !== enhetNode.enhet.id);
      if (filtered.length !== prevSelected.length) {
        // Remove node if already selected
        setSelectedEnhetList(filtered);
        return;
      }

      // Append node if not selected
      setSelectedEnhetList([...prevSelected, enhetNode.enhet]);
    },
    [selectedEnhetList, setSelectedEnhetList, visibleEnhetNodeList],
  );

  const removeEnhetHandler = useCallback(
    (e: React.MouseEvent<HTMLUListElement>) => {
      const li = (e.target as HTMLElement).closest('li');
      const index = Number(li?.dataset.index);
      if (Number.isNaN(index)) return;
      const enhet = selectedEnhetList[index];
      if (!enhet) return;

      const prevSelected = selectedEnhetList;
      const filtered = prevSelected.filter((n) => n.id !== enhet.id);
      if (filtered.length !== prevSelected.length) {
        setSelectedEnhetList(filtered);
        return;
      }
    },
    [selectedEnhetList, setSelectedEnhetList],
  );

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
          e.preventDefault();
          setFocusedList((prev) =>
            prev === 'available' ? 'selected' : 'available',
          );
          setFocusedIndex(0);
          break;
        case 'Enter':
          e.preventDefault();
          if (
            focusedList === 'available' &&
            visibleEnhetNodeList[focusedIndex]
          ) {
            const enhetNode = visibleEnhetNodeList[focusedIndex];
            const filtered = selectedEnhetList.filter(
              (n) => n.id !== enhetNode.enhet.id,
            );
            if (filtered.length !== selectedEnhetList.length) {
              setSelectedEnhetList(filtered);
            } else {
              setSelectedEnhetList([...selectedEnhetList, enhetNode.enhet]);
            }
          } else if (
            focusedList === 'selected' &&
            selectedEnhetList[focusedIndex]
          ) {
            const enhet = selectedEnhetList[focusedIndex];
            setSelectedEnhetList(
              selectedEnhetList.filter((n) => n.id !== enhet.id),
            );
          }
          setFocusedIndex(0);
          break;
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      return () => container.removeEventListener('keydown', handleKeyDown);
    }
  }, [
    expanded,
    focusedList,
    focusedIndex,
    visibleEnhetNodeList,
    selectedEnhetList,
    setSelectedEnhetList,
  ]);

  // Reset focus when search string changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: Always update on searchString change
  useEffect(() => {
    setFocusedIndex(-1);
    setFocusedList('available');
  }, [searchString]);

  return (
    <div
      className={cn(styles.enhetSelector, className)}
      ref={containerRef}
      tabIndex={expanded ? 0 : -1}
    >
      <div className={cn(searchFieldStyles.searchFieldButton)}>
        <EinButton
          style="link"
          className={cn(
            searchFieldStyles.paddedContent,
            styles.enhetSelectorButton,
          )}
        >
          <div className={cn(searchFieldStyles.searchInputIcon)}>
            <Buildings3Icon
              className={cn(styles.searchIcon)}
              title="Enhet"
              fontSize="1.2rem"
            />
          </div>
          {label}
        </EinButton>
      </div>

      {expanded && (
        <>
          <EinInput
            className={cn(styles.enhetSelectorFilterInput)}
            value={searchString}
            onChange={updateSearchString}
            placeholder="Finn virksomhet..."
            autoFocus={true}
            ref={inputRef}
          />
          <div className={cn(styles.enhetSelectorDropdown)}>
            <div className={cn(styles.enhetSelectorDropdownListContainer)}>
              <EinVirtualScroller
                className={cn(styles.enhetSelectorDropdownList)}
                items={visibleEnhetNodeList}
                onClick={addEnhetHandler}
                renderItem={(enhetNode, index, ref) => (
                  <EnhetSelectorSelectItem
                    enhet={enhetNode.enhet}
                    index={index}
                    focused={
                      focusedList === 'available' && focusedIndex === index
                    }
                    forwardRef={ref}
                  />
                )}
              />
            </div>
            <div className={cn(styles.enhetSelectorDropdownListContainer)}>
              <EinVirtualScroller
                className={cn(styles.enhetSelectorDropdownList)}
                items={selectedEnhetList}
                onClick={removeEnhetHandler}
                renderItem={(enhet, index, ref) => (
                  <EnhetSelectorSelectItem
                    enhet={enhet}
                    index={index}
                    remove={true}
                    focused={
                      focusedList === 'selected' && focusedIndex === index
                    }
                    forwardRef={ref}
                  />
                )}
              />
            </div>
          </div>
        </>
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
function getScore(enhet: TrimmedEnhet, searchWord: string) {
  let score = 0;
  let depth = 1;

  const name = {
    nb: enhet.navn.toLowerCase(),
    nn: enhet.navnNynorsk?.toLowerCase(),
    se: enhet.navnSami?.toLowerCase(),
    en: enhet.navnEngelsk?.toLowerCase(),
  };

  if (enhet.enhetstype !== 'DUMMYENHET') {
    // Match
    const matches = [
      name.nb.indexOf(searchWord),
      name.nn?.indexOf(searchWord) ?? -1,
      name.se?.indexOf(searchWord) ?? -1,
      name.en?.indexOf(searchWord) ?? -1,
    ].filter((i) => i >= 0);

    if (matches.length > 0) {
      // Early match (lower number) gives higher score
      const lowestMatch = Math.min(...matches);
      // Score decreases linearly: position 0 = 10, position 10 = 9, position 100 = 1
      score += Math.max(1, 10 - lowestMatch / 10);
    }
  }

  // Recursively check parents for matches
  if (isEnhet(enhet.parent)) {
    const [parentScore, parentDepth] = getScore(
      enhet.parent as TrimmedEnhet,
      searchWord,
    );
    if (parentScore > 0) {
      // Parent match gives lower score
      score += parentScore * 0.2;
    }
    depth += parentDepth;
  }

  return [score, depth];
}

function filterEnhetList(allNodes: EnhetNode[], searchString: string) {
  if (!searchString) {
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
        const [wordScore, depth] = getScore(enhetNode.enhet, word);
        if (wordScore <= 0) {
          score = 0;
          break;
        }
        score += wordScore / Math.max(1, depth); // Prioritize "shallow" matches higher
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

function sortNodes(a: EnhetNode, b: EnhetNode) {
  // Sort by score
  if (a.score !== b.score) {
    return b.score - a.score;
  }

  // Sort by parent existence. Nodes with parents come after nodes without parents.
  const aParent = a.enhet.parent;
  const bParent = b.enhet.parent;
  const aParentId = typeof aParent === 'string' ? aParent : aParent?.id;
  const bParentId = typeof bParent === 'string' ? bParent : bParent?.id;
  if (aParentId && !bParentId) {
    return 1;
  }
  if (!aParentId && bParentId) {
    return -1;
  }

  // Sort by currently active name
  return a.currentName?.localeCompare(b.currentName) ?? 0;
}
