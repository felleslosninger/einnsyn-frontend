import '@digdir/designsystemet-css';
import '@digdir/designsystemet-css/theme';
import type { Metadata } from 'next';
import { KeyboardFocusManager } from '~/components/KeyboardFocusManager/KeyboardFocusManager';
import { NavigationProvider } from '~/components/NavigationProvider/NavigationProvider';
import { SearchFieldProvider } from '~/components/SearchField/SearchFieldProvider';
import { SessionDataProvider } from '~/components/SessionDataProvider/SessionDataProvider';
import ThemeManager from '~/components/ThemeManager/ThemeManager';
import { Footer } from '~/features/footer';
import { cachedAuthInfo } from '~/lib/auth/auth.server';
import { translatePathname } from '~/lib/routing/pathname';
import {
  getRequestPathname,
  getRequestSearchParams,
} from '~/lib/routing/requestPath.server';
import { getSettings } from '~/lib/settings/settings.server';
import { defaultLanguage } from '~/lib/translation/translation';
import { getTranslator } from '~/lib/translation/translation.server';
import { getOrigin } from '~/lib/utils/getOrigin';
import '~/styles/eInnsyn.scss';
import { ModalWrapper } from './@modal/ModalWrapper';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const [origin, pathname, searchParams, t] = await Promise.all([
    getOrigin(),
    getRequestPathname(),
    getRequestSearchParams(),
    getTranslator(),
  ]);
  const search = searchParams.size > 0 ? `?${searchParams}` : '';
  // Every spelling of a path serves the same page
  const canonical = `${origin}${translatePathname(pathname, defaultLanguage)}${search}`;

  return {
    title: { default: 'eInnsyn', template: '%s – eInnsyn' },
    description: t('site.description'),
    alternates: { canonical },
    // Next replaces openGraph whole, so a page setting it must repeat these
    openGraph: { siteName: 'eInnsyn', type: 'website', url: canonical },
    // Keeps iOS from linking org and case numbers as phone numbers
    formatDetection: { telephone: false },
  };
}

export default async function Layout({
  children,
  header,
  modal,
}: Readonly<{
  children: React.ReactNode;
  header: React.ReactNode;
  modal: React.ReactNode;
}>) {
  const settings = await getSettings();
  const authInfo = await cachedAuthInfo();
  const origin = await getOrigin();

  return (
    <html lang={settings.language}>
      <head>
        <meta charSet="utf-8" />
        {/* viewport is set via `export const viewport` above – no manual meta needed */}
      </head>
      <NavigationProvider>
        <SessionDataProvider
          sessionData={{
            settings,
            authInfo,
            origin,
          }}
        >
          <SearchFieldProvider>
            <body data-color-scheme={settings.colorScheme}>
              <div className="einnsyn-body">
                {header}
                <main className="content-flex-grow">{children}</main>
                <Footer />
                <ModalWrapper>{modal}</ModalWrapper>
                <KeyboardFocusManager />
                <ThemeManager />
              </div>
            </body>
          </SearchFieldProvider>
        </SessionDataProvider>
      </NavigationProvider>
    </html>
  );
}
