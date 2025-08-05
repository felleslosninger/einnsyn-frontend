import type { Moetesak } from '@digdir/einnsyn-sdk';
import SearchResultSubheader from './common/SearchResultSubheader';
import { useTranslation } from '~/hooks/useTranslation';
import { EinLink } from '~/components/EinLink/EinLink';
import { TasklistIcon } from '@navikt/aksel-icons';

export default function MoetesakResult({ item }: { item: Moetesak }) {
  const translate = useTranslation();
  return (
    <div className="search-result moetesak-result">
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
