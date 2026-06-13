import { redirect } from 'next/navigation';

/**
 * The Community tab was replaced by Passport. Keep this route alive so old
 * links / bookmarks redirect instead of 404-ing.
 */
export default async function CommunityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/passport`);
}
