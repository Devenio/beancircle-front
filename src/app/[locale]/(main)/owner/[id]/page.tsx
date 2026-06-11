'use client';

import { useRouter } from '@/i18n/navigation';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

/** Legacy owner dashboard — superseded by the Cafe OS workspace. */
export default function LegacyOwnerRedirect() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/cafe-os/${id}`);
  }, [id, router]);
  return null;
}
