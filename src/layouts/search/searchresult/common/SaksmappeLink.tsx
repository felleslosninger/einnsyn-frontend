import { Link } from '@digdir/designsystemet-react';
import { isSaksmappe, type Saksmappe } from '@digdir/einnsyn-sdk';

export default function SaksmappeLink({
  saksmappe,
}: {
  saksmappe: Saksmappe | string | undefined;
}) {
  if (isSaksmappe(saksmappe)) {
    return (
      <Link className="saksmappe-link" href={`/saksmappe/${saksmappe.id}`}>
        {saksmappe.saksnummer}
      </Link>
    );
  }
  return null;
}
