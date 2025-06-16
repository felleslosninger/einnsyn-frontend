import { type Saksmappe, isSaksmappe } from '@digdir/einnsyn-sdk';
import { EinLink } from '~/components/EinLink/EinLink';

export default function SaksmappeLink({
  saksmappe,
}: {
  saksmappe: Saksmappe | string | undefined;
}) {
  if (isSaksmappe(saksmappe)) {
    return (
      <EinLink className="saksmappe-link" href={`/saksmappe/${saksmappe.id}`}>
        {saksmappe.saksnummer}
      </EinLink>
    );
  }
  return null;
}
