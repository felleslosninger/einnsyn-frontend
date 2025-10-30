import type { Moetemappe } from '@digdir/einnsyn-sdk';
import { MeetingLargeIcon } from '@navikt/aksel-icons';
import { EinLink } from '~/components/EinLink/EinLink';
import { useTranslation } from '~/hooks/useTranslation';

export default function MoetemappeModule({ item }: { item: Moetemappe }) {
    const t = useTranslation();
    return (
        <div className="moetemappe-module">
            <EinLink href="">
                <h2 className="ds-heading">{item.offentligTittel}</h2>
            </EinLink>
            <div className="ds-paragraph" data-size="sm">
                <span>{item.moetedato}   </span>

            </div>
        </div>
    );
}