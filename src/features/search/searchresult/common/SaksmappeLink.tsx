import { isSaksmappe, type Saksmappe } from '@digdir/einnsyn-sdk';
import { EinLink } from '~/components/EinLink/EinLink';
import { useTranslation } from '~/hooks/useTranslation';

export default function SaksmappeLink({
  saksmappe,
}: {
  saksmappe: Saksmappe | string | undefined;
}) {
  const t = useTranslation();

  if (isSaksmappe(saksmappe)) {
    return (
      <EinLink
        className="saksmappe-link"
        data-color="neutral"
        href={`/${t('routing.saksmappePath')}/${saksmappe.id}`}
      >
        {saksmappe.saksnummer}
      </EinLink>
    );
  }
  return null;
}
