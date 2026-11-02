import { Heading } from '@digdir/designsystemet-react';
import { EinLink } from '~/components/EinLink/EinLink';
import { buildPathname, type Route } from '~/lib/routing/pathname';

type Mappe = 'saksmappe' | 'moetemappe';

// Temporary stand-in for the saksmappe and møtemappe pages, for trying out
// PageTransition before the real pages are on this branch.
export async function MappePlaceholder({
  mappe,
  params,
}: {
  mappe: Mappe;
  params: Promise<{ enhet: string; rest: string[] }>;
}) {
  const {
    enhet,
    rest: [mappeId, childId],
  } = await params;

  const route = (to: Mappe, id: string, child?: string): Route =>
    to === 'saksmappe'
      ? {
          enhetIdentifier: enhet,
          saksmappeIdentifier: id,
          journalpostIdentifier: child,
        }
      : {
          enhetIdentifier: enhet,
          moetemappeIdentifier: id,
          moetesakIdentifier: child,
        };

  const other: Mappe = mappe === 'saksmappe' ? 'moetemappe' : 'saksmappe';
  const childName = mappe === 'saksmappe' ? 'journalpost' : 'møtesak';

  const links = [
    {
      label: 'Search results for this enhet (outward)',
      href: buildPathname({ enhetIdentifier: enhet }, 'nb'),
    },
    {
      label: 'Search page (outward)',
      href: buildPathname({ page: 'search' }, 'nb'),
    },
    {
      label: `A ${other} (fade)`,
      href: buildPathname(route(other, `${mappeId}-${other}`), 'nb'),
    },
    {
      label: 'About (fade)',
      href: buildPathname({ page: 'about' }, 'nb'),
    },
    {
      label: `Another ${mappe} (no page transition)`,
      href: buildPathname(route(mappe, `${mappeId}-next`), 'nb'),
    },
    {
      label: `A ${childName} in this ${mappe} (no page transition)`,
      href: buildPathname(
        route(mappe, mappeId, `${Number(childId ?? 0) + 1}`),
        'nb',
      ),
    },
  ];

  const linkList = (
    <ul>
      {links.map(({ label, href }) => (
        <li key={href}>
          <EinLink href={href}>{label}</EinLink>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="container-wrapper">
      <div className="container-pre" />
      <div className="container">
        <Heading level={1} data-size="lg">
          {mappe} {mappeId}
          {childId !== undefined && ` / ${childName} ${childId}`}
        </Heading>
        {linkList}
        {Array.from({ length: 30 }, (_, index) => index + 1).map((section) => (
          <section key={section}>
            <Heading level={2} data-size="sm">
              Section {section}
            </Heading>
            <p className="ds-paragraph">
              Placeholder text so the page is tall enough to scroll. Lorem ipsum
              dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim
              veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip
              ex ea commodo consequat.
            </p>
          </section>
        ))}
        {linkList}
      </div>
      <div className="container-post" />
    </div>
  );
}
