import { logout } from '~/actions/authentication/auth';
import { EinButton } from '~/components/EinButton/EinButton';
import { useSessionData } from '~/components/SessionDataProvider/SessionDataProvider';
import { useTranslation } from '~/hooks/useTranslation';

export default function LogoutButton() {
  const t = useTranslation();
  const { authInfo } = useSessionData();
  return (
    <form action={logout}>
      <EinButton type="submit" style="link">
        {t('site.logout')}
      </EinButton>
    </form>
  );
}
