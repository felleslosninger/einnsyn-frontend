import { isSaksmappe, type Saksmappe } from '@digdir/einnsyn-sdk';
import { EinLink } from '~/components/EinLink/EinLink';
import { useSaksmappeURLGenerator } from '~/lib/utils/urlGenerators';

export default function SaksmappeLink({
  saksmappe,
}: {
  saksmappe: Saksmappe | string | undefined;
}) {
  const saksmappeURL = useSaksmappeURLGenerator();

  // A collapsed reference (a bare id) has no saksnummer to label the link with.
  if (!isSaksmappe(saksmappe)) {
    return null;
  }

  return (
    <EinLink
      className="saksmappe-link"
      data-color="neutral"
      href={saksmappeURL(saksmappe)}
    >
      {saksmappe.saksnummer}
    </EinLink>
  );
}
