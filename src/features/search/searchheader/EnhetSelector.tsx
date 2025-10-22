'use client';

import { Checkbox } from '@digdir/designsystemet-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { cachedEnhetList, type TrimmedEnhet } from '~/actions/api/enhetActions';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinInput } from '~/components/EinInput/EinInput';
import EinPopup from '~/components/EinPopup/EinPopup';
import { useOptimisticSearchParams } from '~/components/NavigationProvider/NavigationProvider';
import { useLanguageCode } from '~/hooks/useLanguageCode';

import styles from './EnhetSelector.module.scss';

type EnhetNode = { enhet: TrimmedEnhet; children: Set<EnhetNode> };

export default function EnhetSelector() {
  const languageCode = useLanguageCode();
  const optimisticSearchParams = useOptimisticSearchParams();
  const selectedAdministrativEnhetList: string[] =
    optimisticSearchParams?.getAll('enhet') ?? [];
  const [searchString, setSearchString] = useState('');
  const [enhetList, setEnhetList] = useState<TrimmedEnhet[]>([]);
  const [open, setOpen] = useState(false);

  const tree: Set<EnhetNode> = useMemo(() => {
    const map = new Map<string, EnhetNode>();
    enhetList.forEach((enhet) => {
      // Remove DUMMYENHET
      if (enhet.type === 'DUMMYENHET') return;
      map.set(enhet.id, { enhet, children: new Set() });
    });

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
      if (unmounted) return;
      setEnhetList(enhetList);
    });
    return () => {
      unmounted = true;
    };
  }, []);

  const getName = (enhet: TrimmedEnhet) => {
    return enhet.name[languageCode] ?? enhet.name.nb;
  };

  const sortNodes = (a: EnhetNode, b: EnhetNode) => {
    const aName = getName(a.enhet);
    const bName = getName(b.enhet);
    return aName?.localeCompare(bName) ?? 0;
  };

  const label =
    selectedAdministrativEnhetList.length > 0
      ? selectedAdministrativEnhetList
          .map((id) => enhetList.find((enhet) => enhet.id === id))
          .filter((enhet): enhet is TrimmedEnhet => !!enhet)
          .map((enhet) => getName(enhet))
          .join(', ')
      : 'Vis alle virksomheter';

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

  return (
    <div className={styles.enhetSelector}>
      <EinButton
        onClick={toggleOpen}
        style="link"
        className={styles.enhetSelectorButton}
      >
        {label}
      </EinButton>
      <EinPopup
        open={open}
        setOpen={setOpen}
        className={styles.enhetSelectorDialog}
      >
        <EinInput
          value={searchString}
          onChange={updateSearchString}
          placeholder="Finn virksomhet..."
        />
        {Array.from(tree)
          .sort(sortNodes)
          .map(function recurse(node) {
            return (
              <div className="enhet" key={node.enhet.id}>
                <Checkbox
                  key={node.enhet.id}
                  value={node.enhet.id}
                  label={getName(node.enhet)}
                />
                <div className="children">
                  {Array.from(node.children).sort(sortNodes).map(recurse)}
                </div>
              </div>
            );
          })}
      </EinPopup>
    </div>
  );
}
