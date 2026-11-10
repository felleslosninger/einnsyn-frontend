import { translatedTitleMetadata } from '~/lib/utils/translatedTitleMetadata.server';

export const generateMetadata = translatedTitleMetadata('site.resetPassword');

// LoginModal (in the layout) renders the form for every step.
export default function ForgottenPasswordPage() {
  return null;
}
