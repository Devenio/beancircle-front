'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Hero } from '@/components/marketing/sections/hero';
import { SocialProof } from '@/components/marketing/sections/social-proof';
import { ProductStory } from '@/components/marketing/sections/product-story';
import { NearbyDiscovery } from '@/components/marketing/sections/nearby-discovery';
import { BeansActivity } from '@/components/marketing/sections/beans-activity';
import { CommunitiesSquads } from '@/components/marketing/sections/communities-squads';
import { PassportCollectibles } from '@/components/marketing/sections/passport-collectibles';
import { SafetyTrust } from '@/components/marketing/sections/safety-trust';
import { CreatorOs } from '@/components/marketing/sections/creator-os';
import { FutureVision } from '@/components/marketing/sections/future-vision';
import { Testimonials } from '@/components/marketing/sections/testimonials';
import { DownloadCta } from '@/components/marketing/sections/download-cta';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Bean Circle',
  applicationCategory: 'SocialNetworkingApplication',
  operatingSystem: 'iOS, Android, Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  description:
    'Discover cafés, meet coffee people near you, share thoughts, and build real communities — one circle at a time.',
};

export default function MarketingPage() {
  const router = useRouter();

  // Public landing for logged-out visitors; authenticated users go to the app.
  // `?preview=1` lets a signed-in dev stay on the landing for development.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const preview = new URLSearchParams(window.location.search).get('preview') === '1';
    if (!preview && localStorage.getItem('accessToken')) {
      router.replace('/feed');
    }
  }, [router]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <SocialProof />
      <ProductStory />
      <NearbyDiscovery />
      <BeansActivity />
      <CommunitiesSquads />
      <PassportCollectibles />
      <SafetyTrust />
      <CreatorOs />
      <FutureVision />
      <Testimonials />
      <DownloadCta />
    </>
  );
}
