'use client';

import { Switch, ValidationMessage } from '@digdir/designsystemet-react';
import type { LagretSak } from '@digdir/einnsyn-sdk';
import { TrashIcon } from '@navikt/aksel-icons';
import { useId, useRef, useState, useTransition } from 'react';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinLink } from '~/components/EinLink/EinLink';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { deleteLagretSak, setLagretSakSubscription } from './lagretSak.actions';
import styles from './SavedCases.module.scss';

export function LagretSakItem({
  lagretSak,
  href,
  title,
  translationKey,
  onDelete,
  children,
}: {
  lagretSak: LagretSak;
  href: string;
  title: string;
  translationKey: 'savedCasesPage' | 'savedMeetingsPage';
  onDelete: (id: string) => void;
  children?: React.ReactNode;
}) {
  const t = useTranslation();
  const titleId = useId();
  const [subscribe, setSubscribe] = useState(lagretSak.subscribe ?? false);
  const [error, setError] = useState<string>();
  const [, startSubscribeTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  // The last value the server confirmed, and the newest request sent. Only the
  // newest request may revert the switch, so an older failure arriving late
  // cannot overwrite a later toggle.
  const confirmedSubscribe = useRef(subscribe);
  const latestRequest = useRef(0);

  const handleSubscribeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    const request = ++latestRequest.current;
    setSubscribe(checked);
    setError(undefined);
    startSubscribeTransition(async () => {
      const ok = await setLagretSakSubscription(lagretSak.id, checked);
      if (ok) {
        confirmedSubscribe.current = checked;
      }
      if (request !== latestRequest.current) {
        return;
      }
      if (!ok) {
        setSubscribe(confirmedSubscribe.current);
        setError(t(`bruker.${translationKey}.subscribeError`));
      }
    });
  };

  const handleDelete = () => {
    setError(undefined);
    startDeleteTransition(async () => {
      const ok = await deleteLagretSak(lagretSak.id);
      if (ok) {
        onDelete(lagretSak.id);
      } else {
        setError(t(`bruker.${translationKey}.deleteError`));
      }
    });
  };

  return (
    <li className={styles.item}>
      <div className={styles.row}>
        <div className={styles.main}>
          <EinLink
            id={titleId}
            href={href}
            className={cn('ds-heading', styles.title)}
          >
            {title}
          </EinLink>
          {children}
        </div>
        <div className={styles.actions}>
          <Switch
            data-size="sm"
            checked={subscribe}
            onChange={handleSubscribeChange}
            label={t(`bruker.${translationKey}.subscribe`)}
            aria-describedby={titleId}
          />
          <EinButton
            variant="tertiary"
            data-size="sm"
            disabled={isDeleting}
            aria-describedby={titleId}
            onClick={handleDelete}
          >
            <TrashIcon aria-hidden />
            {t('common.delete')}
          </EinButton>
        </div>
      </div>
      {error && (
        <ValidationMessage data-size="sm" role="alert">
          {error}
        </ValidationMessage>
      )}
    </li>
  );
}
