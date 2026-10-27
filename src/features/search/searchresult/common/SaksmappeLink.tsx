import { isSaksmappe, type Saksmappe } from '@digdir/einnsyn-sdk';
import { EinLink } from '~/components/EinLink/EinLink';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { generateSaksmappeURL } from '~/lib/utils/urlGenerators';

export default function SaksmappeLink({
  saksmappe,
}: {
  saksmappe: Saksmappe | string | undefined;
}) {
  const languageCode = useLanguageCode();

  // A collapsed reference (a bare id) has no saksnummer to label the link with.
  if (!isSaksmappe(saksmappe)) {
    return null;
  }

  return (
    <EinLink
      className="saksmappe-link"
      data-color="neutral"
      href={generateSaksmappeURL(saksmappe, languageCode)}
    >
      {saksmappe.saksnummer}
    </EinLink>
  );
}
