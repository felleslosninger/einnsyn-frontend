import { Chip } from '@digdir/designsystemet-react';
import { EinLink } from '~/components/EinLink/EinLink';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import styles from './LoginButton.module.scss';

export default function LoginButton() {
  const t = useTranslation();
  return (
    <EinLink href="/login" className={cn(styles.loginButton, 'header-button')}>
      <Chip.Button data-color="brand3" asChild>
        <span>{t('site.login')}</span>
      </Chip.Button>
    </EinLink>
  );
}
