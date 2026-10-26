import { translatedTitleMetadata } from '~/lib/utils/translatedTitleMetadata.server';

export { PrivacyPage as default } from '~/features/staticpages';

export const generateMetadata = translatedTitleMetadata('footer.privacy');
