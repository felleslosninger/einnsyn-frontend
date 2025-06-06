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

export default function SearchResult({ item }: { item: Base }) {
  return (
    <div className="search-result">
      {isJournalpost(item) && <JournalpostResult item={item} />}
      {isSaksmappe(item) && <SaksmappeResult item={item} />}
      {isMoetemappe(item) && <MoetemappeResult item={item} />}
      {isMoetesak(item) && <MoetesakResult item={item} />}
    </div>
  );
}
