import { LoginForm } from '~/features/login';
import { translatedTitleMetadata } from '~/lib/utils/translatedTitleMetadata.server';

export const generateMetadata = translatedTitleMetadata('site.login');

export default async function LoginModal() {
  return <LoginForm />;
}
