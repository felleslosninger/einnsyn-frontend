import type { Moetemappe } from '@digdir/einnsyn-sdk';
import { MeetingLargeIcon } from '@navikt/aksel-icons';
import { EinLink } from '~/components/EinLink/EinLink';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import SearchResultSubheader from './common/SearchResultSubheader';

export default function MoetemappeResult({
  className,
  item,
}: {
  className?: string;
  item: Moetemappe;
}) {
  const translate = useTranslation();
  return (
    <div className={cn(className, 'search-result', 'moetemappe-result')}>
      <EinLink href="">
        <h2 className="ds-heading">{item.offentligTittel}</h2>
      </EinLink>
      <div className="ds-paragraph" data-size="sm">
        <SearchResultSubheader
          icon={<MeetingLargeIcon title="a11y-title" fontSize="1.2rem" />}
          item={item}
          label={translate('moetemappe.label')}
        />
      </div>
    </div>
  );
}
