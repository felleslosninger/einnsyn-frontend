import { type Enhet, isEnhet } from '@digdir/einnsyn-sdk';
import Link from 'next/link';
import { Fragment } from 'react/jsx-runtime';
import { useLanguageCode } from '~/hooks/useLanguageCode';

const getAncestors = (enhet: Enhet) => {
  const ancestors: Enhet[] = [];
  let current: Enhet | string | undefined = enhet;
  while (isEnhet(current) && current.enhetstype !== 'DUMMYENHET') {
    ancestors.unshift(current);
    current = current.parent;
  }
  return ancestors;
};

const getHref = (enhet: Enhet) => {
  const ancestors = getAncestors(enhet);
  return ancestors.map((ancestor) => ancestor.id).join('/');
};

const getName = (languageCode: string, enhet: Enhet) => {
  let enhetName = enhet.navn;
  if (languageCode === 'en' && enhet.navnEngelsk) {
    enhetName = enhet.navnEngelsk;
  } else if (languageCode === 'nn' && enhet.navnNynorsk) {
    enhetName = enhet.navnNynorsk;
  } else if (languageCode === 'nb' && enhet.navnSami) {
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

  let enhetName = enhet.navn;
  if (languageCode === 'en' && enhet.navnEngelsk) {
    enhetName = enhet.navnEngelsk;
  } else if (languageCode === 'nn' && enhet.navnNynorsk) {
    enhetName = enhet.navnNynorsk;
  } else if (languageCode === 'nb' && enhet.navnSami) {
    enhetName = enhet.navnSami;
  }

  const ancestors = withAncestors ? getAncestors(enhet) : [enhet];

  return ancestors.map((enhet, index) => (
    <Fragment key={enhet.id}>
      <EinLink href={getHref(enhet)} className="enhet-link">
        {getName(languageCode, enhet)}
      </EinLink>
      {index < ancestors.length - 1 && <span> / </span>}
    </Fragment>
  ));
}
