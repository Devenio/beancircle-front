import { redirect } from 'next/navigation';

// Unified discover map now lives at /discover/map
export default function DiscoverPeopleMapPage({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/discover/map`);
}
