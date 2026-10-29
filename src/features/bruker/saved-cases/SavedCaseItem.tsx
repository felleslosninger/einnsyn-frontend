'use client';

import { isEnhet, isSaksmappe, type LagretSak } from '@digdir/einnsyn-sdk';
import { EinMetaRow } from '~/components/EinMetaRow/EinMetaRow';
import EnhetLink from '~/features/search/searchresult/common/EnhetLink';
import SearchResultSubheader from '~/features/search/searchresult/common/SearchResultSubheader';
import { getSaksmappeHref } from '~/features/search/searchresult/SaksmappeResult';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import { getName } from '~/lib/enhet/enhet';
import cn from '~/lib/utils/className';
import { dateFormat } from '~/lib/utils/dateFormat';
import { LagretSakItem } from './LagretSakItem';
import type { LagretSakVariant } from './LagretSakVariantToggle';
import styles from './SavedCases.module.scss';

export function SavedCaseItem({
  savedCase,
  variant,
  onDelete,
}: {
  savedCase: LagretSak;
  variant: LagretSakVariant;
  onDelete: (id: string) => void;
}) {
  const t = useTranslation();
  const languageCode = useLanguageCode();

  const saksmappe = savedCase.saksmappe;
  if (!isSaksmappe(saksmappe)) {
    return null;
  }
  const enhet = saksmappe.administrativEnhetObjekt;
  const enhetName = isEnhet(enhet) ? getName(enhet, languageCode) : undefined;

  return (
    <LagretSakItem
      lagretSak={savedCase}
      href={getSaksmappeHref(saksmappe, languageCode)}
      title={saksmappe.offentligTittel}
      translationKey="savedCasesPage"
      onDelete={onDelete}
    >
      {variant === 'enhet' && enhetName && (
        <span className={cn('ds-paragraph', styles.meta)} data-size="sm">
          {enhetName}
        </span>
      )}
      {variant === 'compact' && (
        <EinMetaRow className={cn('ds-paragraph', styles.meta)}>
          {enhetName}
          {saksmappe.saksnummer &&
            `${t('common.number')} ${saksmappe.saksnummer}`}
          {saksmappe.oppdatertDato &&
            `${t('common.updatedAt')} ${dateFormat(saksmappe.oppdatertDato, languageCode)}`}
        </EinMetaRow>
      )}
      {variant === 'search' && (
        <div className={cn('ds-paragraph', styles.metaStack)} data-size="sm">
          <SearchResultSubheader
            variant="saksmappe"
            item={saksmappe}
            label={t('saksmappe.label')}
          >
            {saksmappe.saksnummer && (
              <span>
                {t('common.number')} {saksmappe.saksnummer}
              </span>
            )}
          </SearchResultSubheader>
          <div>
            <EnhetLink enhet={enhet} withAncestors={false} />
          </div>
        </div>
      )}
    </LagretSakItem>
  );
}
