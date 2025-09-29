import { isEnhet, type Journalpost } from '@digdir/einnsyn-sdk';
import { ArrowRightIcon, FileIcon } from '@navikt/aksel-icons';
import { Fragment } from 'react/jsx-runtime';
import { EinLink } from '~/components/EinLink/EinLink';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import EnhetLink from './searchresult/common/EnhetLink';
import SaksmappeLink from './searchresult/common/SaksmappeLink';
import SearchResultSubheader from './searchresult/common/SearchResultSubheader';

export default function JournalpostResult({
  className,
  item,
}: {
  className?: string;
  item: Journalpost;
}) {
  const translate = useTranslation();

  return (
    <div className={cn(className, 'search-result', 'journalpost-result')}>
      <EinLink href="">
        <h2 className="ds-heading">{item.offentligTittel}</h2>
      </EinLink>
      <div className="ds-paragraph" data-size="sm">
        <SearchResultSubheader
          item={item}
          icon={<FileIcon title="a11y-title" fontSize="1rem" />}
          label={translate('journalpost.label')}
        />
        <div className="journalpost-enhet">
          <JournalpostOwner journalpost={item} />
        </div>
        <div className="search-result-saksnummer">
          {translate('saksmappe.saksnummer')}:{' '}
          <SaksmappeLink saksmappe={item.saksmappe} />
        </div>
      </div>
    </div>
  );
}

function JournalpostOwner({ journalpost }: { journalpost: Journalpost }) {
  const korrespondansepartList = journalpost.korrespondansepart ?? [];

  if (!isEnhet(journalpost.administrativEnhetObjekt)) {
    return;
  }

  // Document received by the owner
  if (journalpost.journalposttype === 'inngaaende_dokument') {
    const avsenderList = korrespondansepartList
      .filter((k) => typeof k !== 'string')
      .filter((k) => /^[Aa]vsender$/.test(k.korrespondanseparttype))
      .map((k) => (
        <Fragment key={k.id}>{k.korrespondansepartNavnSensitiv}</Fragment>
      ));

    return (
      <>
        {avsenderList}
        <ArrowRightIcon fontSize="1.5rem" />
        <EnhetLink
          withAncestors={false}
          enhet={journalpost.administrativEnhetObjekt}
        />
      </>
    );
  }

  // Document sent by the owner
  if (journalpost.journalposttype === 'utgaaende_dokument') {
    const mottakerList = korrespondansepartList
      .filter((k) => typeof k !== 'string')
      .filter((k) => /^[Mm]ottaker$/.test(k.korrespondanseparttype))
      .map((k) => (
        <Fragment key={k.id}>{k.korrespondansepartNavnSensitiv}</Fragment>
      ));

    return (
      <>
        <EnhetLink
          withAncestors={false}
          enhet={journalpost.administrativEnhetObjekt}
        />
        <ArrowRightIcon />
        {mottakerList}
      </>
    );
  }

  // Display only one party
  return (
    <EnhetLink
      withAncestors={false}
      enhet={journalpost.administrativEnhetObjekt}
    />
  );
}
