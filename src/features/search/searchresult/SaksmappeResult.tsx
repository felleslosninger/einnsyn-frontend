import type { Saksmappe } from '@digdir/einnsyn-sdk';
import { FolderFileIcon } from '@navikt/aksel-icons';
import { EinLink } from '~/components/EinLink/EinLink';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import EnhetLink, { getEnhetHref } from './common/EnhetLink';
import SearchResultSubheader from './common/SearchResultSubheader';

export const getSaksmappeHref = (saksmappe: Saksmappe) => {
  const enhet = saksmappe.administrativEnhetObjekt;

  // Fail gracefully if enhet isn't expanded
  if (typeof enhet === 'string') {
    return '';
  }

  const enhetHref = getEnhetHref(enhet);
  return `${enhetHref}/saksmappe/${saksmappe.id}`;
};

export default function SaksmappeResult({
  className,
  item,
}: {
  className?: string;
  item: Saksmappe;
}) {
  const translate = useTranslation();
  const saksmappeHref = getSaksmappeHref(item);
  return (
    <div className={cn(className, 'search-result', 'saksmappe-result')}>
      <EinLink href={saksmappeHref}>
        <h2 className="ds-heading">{item.offentligTittel}</h2>
      </EinLink>
      <div className="ds-paragraph" data-size="sm">
        <SearchResultSubheader
          icon={
            <FolderFileIcon
              aria-hidden="true"
              focusable="false"
              fontSize="1.2rem"
            />
          }
          item={item}
          label={translate('saksmappe.label')}
        />
        <div className="saksmappe-enhet">
          <EnhetLink
            withAncestors={false}
            enhet={item.administrativEnhetObjekt}
          />
        </div>
      </div>
    </div>
  );
}
