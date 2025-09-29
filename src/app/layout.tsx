import '@digdir/designsystemet-css';
import '@digdir/designsystemet-theme';
import type { Metadata, ResolvingMetadata } from 'next';
import { cachedAuthInfo } from '~/actions/authentication/auth';
import { getAuth } from '~/actions/cookies/authCookie';
import { getSettings } from '~/actions/cookies/settingsCookie';
import Footer from '~/app/_footer/Footer';
import { NavigationProvider } from '~/components/NavigationProvider/NavigationProvider';
import { SessionDataProvider } from '~/components/SessionDataProvider/SessionDataProvider';
import ThemeManager from '~/components/ThemeManager/ThemeManager';
import { getOrigin } from '~/lib/utils/getOrigin';
import '~/styles/eInnsyn.scss';
import { ModalWrapper } from './@modal/ModalWrapper';
import { SearchFieldProvider } from '~/components/SearchField/SearchFieldProvider';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

type Props = {
  params: Promise<{ path: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { language } = await getSettings();
  const auth = await getAuth();

  // fetch post information

  return {
    title: 'eInnsyn',
    description: '',
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
                <ThemeManager />
              </div>
            </body>
          </SearchFieldProvider>
        </SessionDataProvider>
      </NavigationProvider>
    </html>
  );
}
