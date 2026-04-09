'use client';

import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import styles from './ApiKeys.module.scss';
import { EinButton } from '~/components/EinButton/EinButton';
import { ansattportenAuthAction } from '~/actions/authentication/auth.ansattporten';
import { useFormStatus } from 'react-dom';
import { useModalBasepath } from '~/app/@modal/ModalWrapper';
import { useSessionData } from '~/components/SessionDataProvider/SessionDataProvider';

export default function ApiKeys() {
    const t = useTranslation();
    const basepath = useModalBasepath();
    const { origin } = useSessionData();
    const { pending } = useFormStatus();
    const originUrl = new URL(basepath, origin).href;

    return (
        <div className="container-wrapper main-content">
            <div className="container-pre collapsible" />
            <div className="container">
                <h1 className="ds-heading" data-size="lg">
                    {t('admin.apiKey.labelPlural')}
                </h1>

                <div className={styles.header}>
                    <div className={cn(styles.intro, 'text-container')}>
                        {t('admin.apiKey.intro')}
                    </div>
                </div>

                <form action={ansattportenAuthAction}>
                    <input type="hidden" name="originUrl" value={originUrl} />
                    <EinButton type="submit" disabled={pending}>
                        {t('admin.apiKey.login')}
                    </EinButton>
                </form>

            </div>
            <div className="container-post" />
        </div>
    );
}
