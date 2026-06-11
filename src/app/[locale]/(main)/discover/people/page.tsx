import { redirect } from 'next/navigation';

export default async function DiscoverPeopleRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/discover`);
}
