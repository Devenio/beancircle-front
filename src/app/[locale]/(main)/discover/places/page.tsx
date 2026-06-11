import { redirect } from 'next/navigation';

export default async function DiscoverPlacesRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/discover`);
}
