'use client';

import { Switch } from '@digdir/designsystemet-react';
import type { LagretSoek } from '@digdir/einnsyn-sdk';
import { TrashIcon } from '@navikt/aksel-icons';
import { useState, useTransition } from 'react';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinLink } from '~/components/EinLink/EinLink';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import {
  deleteLagretSoek,
  setLagretSoekSubscription,
} from './lagretSoek.actions';
import styles from './SavedSearches.module.scss';

export function SavedSearchItem({
  savedSearch,
  href,
}: {
  savedSearch: LagretSoek;
  href: string;
}) {
  const t = useTranslation();
  const [subscribe, setSubscribe] = useState(savedSearch.subscribe ?? false);
  const [, startSubscribeTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const handleSubscribeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSubscribe(checked);
    startSubscribeTransition(async () => {
      // Put the switch back if the server never stored the change, rather than
      // leaving it showing a subscription the user does not have.
      if (!(await setLagretSoekSubscription(savedSearch.id, checked))) {
        setSubscribe(!checked);
      }
    });
  };

  return (
    <li className={styles.item}>
      <EinLink href={href} className={cn('ds-heading', styles.title)}>
        {savedSearch.label}
      </EinLink>
      <div className={styles.actions}>
        <Switch
          data-size="sm"
          checked={subscribe}
          onChange={handleSubscribeChange}
          label={t('bruker.savedSearchesPage.subscribe')}
        />
        <EinButton
          variant="tertiary"
          data-size="sm"
          disabled={isDeleting}
          onClick={() =>
            startDeleteTransition(async () => {
              // A failure leaves the item in place, since the server only
              // revalidates the list once the delete has actually happened.
              await deleteLagretSoek(savedSearch.id);
            })
          }
        >
          <TrashIcon aria-hidden />
          {t('common.delete')}
        </EinButton>
      </div>
    </li>
  );
}
