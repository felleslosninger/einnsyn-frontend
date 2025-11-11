'use client';

import { Buildings3Icon } from '@navikt/aksel-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { cachedEnhetList, type TrimmedEnhet } from '~/actions/api/enhetActions';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinInput } from '~/components/EinInput/EinInput';
import { EinVirtualScroller } from '~/components/EinVirtualScroller';
import { useOptimisticSearchParams } from '~/components/NavigationProvider/NavigationProvider';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import cn from '~/lib/utils/className';
import styles from './EnhetSelector.module.scss';
import searchFieldStyles from './SearchField.module.scss';
import { EnhetSelectorSelectItem } from './EnhetSelectorSelectItem';

export type EnhetNode = { enhet: TrimmedEnhet; children: Set<EnhetNode> };

export default function EnhetSelector({
  className,
  expanded = false,
}: {
  className?: string;
  expanded?: boolean;
}) {
  const languageCode = useLanguageCode();
  const optimisticSearchParams = useOptimisticSearchParams();
  const selectedAdministrativEnhetList: string[] =
    optimisticSearchParams?.getAll('enhet') ?? [];
  const [searchString, setSearchString] = useState('');
  const [enhetList, setEnhetList] = useState<TrimmedEnhet[]>([]);
  const [open, setOpen] = useState(false);

  // Get a sorted tree structure of enheter, filtered by search string
  const tree: Set<EnhetNode> = useMemo(() => {
    const map = new Map<string, EnhetNode>();
    enhetList.forEach((enhet) => {
      map.set(enhet.id, { enhet, children: new Set() });
    });

    // Remove parentId where the parent does not exist in the list
    // (this mutates the list, but it's an acceptable trade-off for performance)
    for (const enhet of enhetList) {
      if (enhet.parentId && !map.has(enhet.parentId)) {
        enhet.parentId = null;
      }
    }

    // Filter by query string
    let visibleEnhetIds: Set<string> | null = null;
    if (searchString) {
      visibleEnhetIds = new Set<string>();
      const lowerCaseSearchString = searchString.toLowerCase();

      for (const enhet of enhetList) {
        if (
          enhet.name.nb.toLowerCase().includes(lowerCaseSearchString) ||
          enhet.name.nn?.toLowerCase().includes(lowerCaseSearchString) ||
          enhet.name.en?.toLowerCase().includes(lowerCaseSearchString) ||
          enhet.name.se?.toLowerCase().includes(lowerCaseSearchString)
        ) {
          let currentParentId: string | null = enhet.id;
          while (currentParentId && !visibleEnhetIds.has(currentParentId)) {
            visibleEnhetIds.add(currentParentId);
            const currentEnhet: TrimmedEnhet | undefined =
              map.get(currentParentId)?.enhet;
            currentParentId = currentEnhet?.parentId ?? null;
          }
        }
      }
    }

    const roots = new Set<EnhetNode>();
    for (const enhet of enhetList) {
      if (visibleEnhetIds && !visibleEnhetIds.has(enhet.id)) {
        continue;
      }
      const node = map.get(enhet.id);
      if (node && enhet.parentId) {
        const parentNode = map.get(enhet.parentId);
        if (parentNode) {
          parentNode.children.add(node);
        } else {
          roots.add(node);
        }
      } else if (node) {
        roots.add(node);
      }
    }

    return roots;
  }, [enhetList, searchString]);

  // Fetch enhet list on mount
  useEffect(() => {
    let unmounted = false;
    cachedEnhetList().then((enhetList) => {
      if (unmounted) {
        return;
      }

      // Remove DUMMYENHET
      enhetList = enhetList.filter((enhet) => enhet.type !== 'DUMMYENHET');

      setEnhetList(enhetList);
    });
    return () => {
      unmounted = true;
    };
  }, []);

  // Get the name of an Enhet in the current language
  const getName = useCallback(
    (enhet: TrimmedEnhet) => {
      return enhet.name[languageCode] ?? enhet.name.nb;
    },
    [languageCode],
  );

  // Sort nodes first by whether they have a parent, then by name.
  // We want top-level nodes first.
  const sortNodes = useCallback(
    (a: EnhetNode, b: EnhetNode) => {
      const aParentId = a.enhet.parentId;
      const bParentId = b.enhet.parentId;

      // Nodes with parents come after nodes without parents
      if (aParentId && !bParentId) {
        return 1;
      }
      if (!aParentId && bParentId) {
        return -1;
      }

      // Sort by name
      const aName = getName(a.enhet);
      const bName = getName(b.enhet);
      return aName?.localeCompare(bName) ?? 0;
    },
    [getName],
  );

  const label = useMemo(() => {
    return selectedAdministrativEnhetList.length > 0
      ? selectedAdministrativEnhetList
          .map((id) => enhetList.find((enhet) => enhet.id === id))
          .filter((enhet): enhet is TrimmedEnhet => !!enhet)
          .map((enhet) => getName(enhet))
          .join(', ')
      : 'Virksomheter';
  }, [selectedAdministrativEnhetList, enhetList, getName]);

  const toggleOpen = useCallback(() => {
    if (open) {
      // Animate open / close
    }
    setOpen((prev) => !prev);
  }, [open]);

  const updateSearchString = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchString(e.target.value);
    },
    [],
  );

  // Sort nodes for rendering
  const sortedNodes = useMemo(() => {
    return Array.from(tree).sort(sortNodes);
  }, [tree, sortNodes]);

  return (
    <div className={cn(styles.enhetSelector, className)}>
      <div className={cn(searchFieldStyles.searchFieldButton)}>
        <EinButton style="link" className={cn(searchFieldStyles.paddedContent)}>
          <div className={cn(searchFieldStyles.searchInputIcon)}>
            <Buildings3Icon
              className={cn(styles.searchIcon)}
              title="Enhet"
              fontSize="1.2rem"
            />
          </div>
          Virksomheter
        </EinButton>
      </div>

      {expanded && (
        <div className={cn(styles.enhetSelectorDropdown)}>
          <div className={cn(styles.enhetSelectorDropdownList)}>
            <EinInput
              value={searchString}
              onChange={updateSearchString}
              placeholder="Finn virksomhet..."
            />
            <EinVirtualScroller
              items={sortedNodes}
              renderItem={(enhet) => (
                <EnhetSelectorSelectItem enhetNode={enhet} />
              )}
            />
          </div>
          <div className={cn(styles.enhetSelectorDropdownList)}>
            Remove these
          </div>
        </div>
      )}
    </div>
  );
}
