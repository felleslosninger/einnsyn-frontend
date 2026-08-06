import { Header } from '~/features/header';

export default async function HeaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Header>{children}</Header>;
}
