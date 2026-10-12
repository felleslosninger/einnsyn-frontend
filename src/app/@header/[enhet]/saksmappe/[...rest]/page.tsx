import { SaksmappeHeaderRow } from '~/features/entities';

export default async function SaksmappeHeaderSlot({
  params,
}: Readonly<{
  params: Promise<{ rest: string[] }>;
}>) {
  const awaitedParams = await params;
  const [saksmappeId] = awaitedParams.rest;

  return <SaksmappeHeaderRow saksmappeId={saksmappeId} />;
}
