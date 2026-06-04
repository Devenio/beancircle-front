'use client';

import { useParams } from 'next/navigation';
import { MessagesHub } from '@/components/chat/messages-hub';

/** Deep link: opens Messages with Archived tab active (no full page navigation). */
export default function ArchivedMessagesPage() {
  const { locale } = useParams<{ locale: string }>();
  return <MessagesHub locale={locale} initialTab="archived" />;
}
