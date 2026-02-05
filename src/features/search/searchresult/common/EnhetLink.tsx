import { type Enhet, isEnhet } from '@digdir/einnsyn-sdk';
import { Fragment } from 'react/jsx-runtime';
import { EinLink } from '~/components/EinLink/EinLink';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { getAncestors, getEnhetHref } from '~/lib/utils/enhetUtils';

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
  withAncestors = true,
  ...props
}: {
  enhet: Enhet | string;
  withAncestors?: boolean;
} & React.DetailedHTMLProps<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
>) {
  const languageCode = useLanguageCode();

  if (!isEnhet(enhet)) {
    return <></>;
  }

  const ancestors = withAncestors ? getAncestors(enhet) : [enhet];

  return ancestors.map((enhet, index) => (
    <Fragment key={enhet.id}>
      <EinLink
        data-color="neutral"
        href={getEnhetHref(enhet)}
        className="enhet-link"
      >
        {getName(languageCode, enhet)}
      </EinLink>
      {index < ancestors.length - 1 && <span> / </span>}
    </Fragment>
  ));
}
