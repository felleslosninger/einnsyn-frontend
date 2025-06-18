import type { Metadata, ResolvingMetadata } from 'next';
import Footer from '~/app/_footer/Footer';
import Header from '~/app/_header/Header';

import '@digdir/designsystemet-css';
import '@digdir/designsystemet-theme';
import { getAuthInfo } from '~/actions/authentication/auth';
import { getAuth } from '~/actions/cookies/authCookie';
import { getSettings } from '~/actions/cookies/settingsCookie';
import { SessionDataProvider } from '~/components/SessionDataProvider/SessionDataProvider';
import '~/styles/eInnsyn.scss';
import { ModalWrapper } from './@modal/ModalWrapper';

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
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  const settings = await getSettings();
  const authInfo = await getAuthInfo();

  return (
    <html lang={settings.language}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        <div className="einnsyn-body">
          <SessionDataProvider
            sessionData={{
              settings,
              authInfo,
            }}
          >
            <Header />
            {children}
            <ModalWrapper>{modal}</ModalWrapper>
            <Footer />
          </SessionDataProvider>
        </div>
      </body>
    </html>
  );
}
