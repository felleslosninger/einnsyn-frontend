import { type Enhet, isEnhet } from '@digdir/einnsyn-sdk';
import { EinLink } from '~/components/EinLink/EinLink';
import { useLanguageCode } from '~/hooks/useLanguageCode';

export const getEnhetHref = (enhet: Enhet) => {
  return [enhet.id].join('/');
};

const getName = (languageCode: string, enhet: Enhet) => {
  let enhetName = enhet.navn;
  if (languageCode === 'nb' && enhet.navn) {
    enhetName = enhet.navn;
  } else if (languageCode === 'en' && enhet.navnEngelsk) {
    enhetName = enhet.navnEngelsk;
  } else if (languageCode === 'nn' && enhet.navnNynorsk) {
    enhetName = enhet.navnNynorsk;
  } else if (languageCode === 'se' && enhet.navnSami) {
    enhetName = enhet.navnSami;
  }
  return enhetName;
};

export default function EnhetLink({
  enhet,
  className,
  ...props
}: {
  enhet: Enhet | string;
} & React.DetailedHTMLProps<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
>) {
  const languageCode = useLanguageCode();

  if (!isEnhet(enhet)) {
    return;
  }

  return (
    <EinLink
      data-color="neutral"
      href={getEnhetHref(enhet)}
      className="enhet-link"
    >
      {getName(languageCode, enhet)}
    </EinLink>
  );
}