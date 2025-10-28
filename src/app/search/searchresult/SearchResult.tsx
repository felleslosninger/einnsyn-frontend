import {
  type Base,
  isJournalpost,
  isMoetemappe,
  isMoetesak,
  isSaksmappe,
} from '@digdir/einnsyn-sdk';
import JournalpostResult from './JournalpostResult';
import MoetemappeResult from './MoetemappeResult';
import MoetesakResult from './MoetesakResult';
import SaksmappeResult from './SaksmappeResult';

import './searchResultStyles.scss';

export default function SearchResult({
  className,
  item,
}: {
  className: string;
  item: Base;
}) {
  return (
    <>
      {isJournalpost(item) && (
        <JournalpostResult className={className} item={item} />
      )}
      {isSaksmappe(item) && (
        <SaksmappeResult className={className} item={item} />
      )}
      {isMoetemappe(item) && (
        <MoetemappeResult className={className} item={item} />
      )}
      {isMoetesak(item) && <MoetesakResult className={className} item={item} />}
    </>
  );
}
