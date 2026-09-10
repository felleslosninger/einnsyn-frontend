import { AdminHeaderRow } from '~/features/admin';

// Every admin route shows the same header row, so it is rendered here rather
// than by each slot page — `children` is what a more specific admin route would
// add below it, and today none do.
export default function AdminHeaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminHeaderRow />
      {children}
    </>
  );
}
