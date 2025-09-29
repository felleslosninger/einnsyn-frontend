import type { Moetesak } from '@digdir/einnsyn-sdk';
import { TasklistIcon } from '@navikt/aksel-icons';
import { EinLink } from '~/components/EinLink/EinLink';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import SearchResultSubheader from '../../app/search/searchresult/common/SearchResultSubheader';

export default function MoetesakResult({
  className,
  item,
}: {
  className?: string;
  item: Moetesak;
}) {
  const translate = useTranslation();
  return (
    <div className={cn(className, 'search-result', 'moetesak-result')}>
      <EinLink href="">
        <h2 className="ds-heading">{item.offentligTittel}</h2>
      </EinLink>
      <div className="ds-paragraph" data-size="sm">
        <SearchResultSubheader
          icon={<TasklistIcon title="a11y-title" fontSize="1.2rem" />}
          item={item}
          label={translate('moetesak.label')}
        />
      </div>
    </div>
  );
}
