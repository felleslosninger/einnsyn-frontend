import Header from './Header';

export default async function HeaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Header>{children}</Header>;
}
