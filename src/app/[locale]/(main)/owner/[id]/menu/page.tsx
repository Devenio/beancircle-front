'use client';

import { useRouter } from '@/i18n/navigation';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

/** Legacy menu editor — superseded by the Cafe OS menu builder. */
export default function LegacyOwnerMenuRedirect() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/cafe-os/${id}/menu`);
  }, [id, router]);
  return null;
}
