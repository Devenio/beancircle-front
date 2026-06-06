import { redirect } from 'next/navigation';

export default async function ExploreRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/discover/people`);
}
