import { EinButton } from '~/components/EinButton/EinButton';
import { useSessionData } from '~/components/SessionDataProvider/SessionDataProvider';
import { useTranslation } from '~/hooks/useTranslation';
import { logoutAction } from '~/lib/auth/auth.actions';

export default function LogoutButton() {
  const t = useTranslation();
  const { authInfo } = useSessionData();
  return (
    <form action={logoutAction}>
      <EinButton type="submit" style="link">
        {t('site.logout')}
      </EinButton>
    </form>
  );
}
