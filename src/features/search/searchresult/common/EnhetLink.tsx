import { type Enhet, isEnhet } from '@digdir/einnsyn-sdk';
import { Fragment } from 'react/jsx-runtime';
import { EinLink } from '~/components/EinLink/EinLink';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import cn from '~/lib/utils/className';
import { getAncestors, getEnhetHref, getName } from '~/lib/utils/enhetUtils';

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
        className={cn('enhet-link', className)}
        {...props}
      >
        {getName(enhet, languageCode)}
      </EinLink>
      {index < ancestors.length - 1 && <span> / </span>}
    </Fragment>
  ));
}
