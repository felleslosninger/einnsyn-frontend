import type { Saksmappe } from '@digdir/einnsyn-sdk';
import { useTranslation } from '~/hooks/useTranslation';
import EnhetLink from './common/EnhetLink';
import SearchResultSubheader from './common/SearchResultSubheader';
import { EinLink } from '~/components/EinLink/EinLink';
import { generateSaksmappeURL } from '~/lib/utils/urlGenerators';

export default function SaksmappeResult({ item }: { item: Saksmappe }) {
  const translate = useTranslation();
  const saksmappeLink = generateSaksmappeURL(item);
  return (
    <div className="search-result saksmappe-result">
      <EinLink className={'saksmappe-link'} href={saksmappeLink}>
        <h2 className="ds-heading">{item.offentligTittel}</h2>
      </EinLink>
      <div className="ds-paragraph" data-size="sm">
        <div className="saksmappe-enhet">
          <EnhetLink
            withAncestors={false}
            enhet={item.administrativEnhetObjekt}
          />
        </div>
        <SearchResultSubheader
          item={item}
          label={translate('saksmappe.label')}
        />
      </div>
    </div>
  );
}
