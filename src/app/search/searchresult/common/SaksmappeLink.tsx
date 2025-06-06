import { Link } from '@digdir/designsystemet-react';
import { isSaksmappe, type Saksmappe } from '@digdir/einnsyn-sdk';

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
