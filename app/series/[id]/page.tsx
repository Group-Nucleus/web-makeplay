import { SeriesDetailPage } from './SeriesDetailPage';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ code?: string }>;
}) {
  const { id } = await params;
  const { code } = await searchParams;
  return <SeriesDetailPage seriesId={id} inviteCode={code} />;
}
