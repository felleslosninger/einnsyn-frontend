import type { Metadata, ResolvingMetadata } from 'next';
import Footer from '~/layouts/footer/Footer';
import Header from '~/layouts/header/Header';

import '@digdir/designsystemet-css';
import '@digdir/designsystemet-theme';
import { getSettings } from '~/actions/cookies/settingsCookie';
import '~/styles/eInnsyn.scss';
import ModalContainer from '~/modals/ModalContainer';

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

	return (
		<html lang={settings.language}>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
			</head>
			<body>
				<Header />
				{children}
				<ModalContainer />
				<Footer />
			</body>
		</html>
	);
}
