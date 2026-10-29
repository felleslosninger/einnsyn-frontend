'use client';

import { isEnhet, isMoetemappe, type LagretSak } from '@digdir/einnsyn-sdk';
import { EinMetaRow } from '~/components/EinMetaRow/EinMetaRow';
import { LagretSakItem } from '~/features/bruker/saved-cases/LagretSakItem';
import type { LagretSakVariant } from '~/features/bruker/saved-cases/LagretSakVariantToggle';
import styles from '~/features/bruker/saved-cases/SavedCases.module.scss';
import EnhetLink from '~/features/search/searchresult/common/EnhetLink';
import SearchResultSubheader from '~/features/search/searchresult/common/SearchResultSubheader';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import {
  getAncestorsAsString,
  getEnhetIdentifier,
  getName,
} from '~/lib/enhet/enhet';
import { buildPathname } from '~/lib/routing/pathname';
import cn from '~/lib/utils/className';
import { dateFormat } from '~/lib/utils/dateFormat';

export function SavedMeetingItem({
  savedMeeting,
  variant,
  onDelete,
}: {
  savedMeeting: LagretSak;
  variant: LagretSakVariant;
  onDelete: (id: string) => void;
}) {
  const t = useTranslation();
  const languageCode = useLanguageCode();

  const moetemappe = savedMeeting.moetemappe;
  if (!isMoetemappe(moetemappe)) {
    return null;
  }
  const utvalg = moetemappe.utvalgObjekt;
  // An utvalg name like "Formannskapet" says little without the organization
  // it belongs to, so it is shown with its ancestors.
  const utvalgName = isEnhet(utvalg)
    ? [
        getAncestorsAsString(utvalg, languageCode),
        getName(utvalg, languageCode),
      ]
        .filter(Boolean)
        .join(' / ')
    : undefined;
  const meetingDate = moetemappe.moetedato
    ? dateFormat(moetemappe.moetedato, languageCode)
    : undefined;
  const href = isEnhet(utvalg)
    ? buildPathname(
        {
          enhetIdentifier: getEnhetIdentifier(utvalg),
          moetemappeIdentifier: moetemappe.id,
        },
        languageCode,
      )
    : '';

  return (
    <LagretSakItem
      lagretSak={savedMeeting}
      href={href}
      title={moetemappe.offentligTittel}
      translationKey="savedMeetingsPage"
      onDelete={onDelete}
    >
      {variant === 'enhet' && utvalgName && (
        <span className={cn('ds-paragraph', styles.meta)} data-size="sm">
          {utvalgName}
        </span>
      )}
      {variant === 'compact' && (
        <EinMetaRow className={cn('ds-paragraph', styles.meta)}>
          {meetingDate}
          {utvalgName}
        </EinMetaRow>
      )}
      {variant === 'search' && (
        <div className={cn('ds-paragraph', styles.metaStack)} data-size="sm">
          <SearchResultSubheader
            variant="moetemappe"
            item={moetemappe}
            label={t('moetemappe.label')}
          >
            {meetingDate && <span>{meetingDate}</span>}
            {moetemappe.moetested && <span>{moetemappe.moetested}</span>}
          </SearchResultSubheader>
          <div>
            <EnhetLink enhet={utvalg} withAncestors={false} />
          </div>
        </div>
      )}
    </LagretSakItem>
  );
}
